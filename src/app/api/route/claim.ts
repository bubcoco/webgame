// src/app/api/claim/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

// Configuration
const PRIVATE_KEY = process.env.GAME_ADMIN_PRIVATE_KEY!;
const RPC_URL = process.env.RPC_URL!;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

// Contract ABI - only the functions we need
const contractABI = [
  "function mintReward(address player, uint256 coinsCollected, bytes32 sessionId) external",
  "function claimedSessions(bytes32) view returns (bool)",
  "function balanceOf(address) view returns (uint256)"
];

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_CLAIMS_PER_HOUR = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

/**
 * Check rate limit for an address
 */
function checkRateLimit(address: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(address);

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitMap.set(address, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true, remaining: MAX_CLAIMS_PER_HOUR - 1 };
  }

  if (record.count >= MAX_CLAIMS_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_CLAIMS_PER_HOUR - record.count };
}

/**
 * Generate session ID (must match frontend)
 */
function generateSessionId(playerAddress: string, score: number, timestamp: number): string {
  const data = ethers.solidityPacked(
    ['address', 'uint256', 'uint256'],
    [playerAddress, score, timestamp]
  );
  return ethers.keccak256(data);
}

/**
 * Validate score (basic anti-cheat)
 */
function validateScore(score: number): { valid: boolean; reason?: string } {
  if (score < 0) {
    return { valid: false, reason: 'Score cannot be negative' };
  }
  
  if (score > 10000) {
    return { valid: false, reason: 'Score too high (possible cheat)' };
  }

  if (score % 100 !== 0) {
    return { valid: false, reason: 'Invalid score format' };
  }

  return { valid: true };
}

/**
 * GET endpoint - For signature verification
 * Used when you want to verify scores before claiming
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const score = searchParams.get("score");
  const timestamp = searchParams.get("timestamp");

  if (!address || !score) {
    return NextResponse.json(
      { error: "Missing required parameters: address and score" }, 
      { status: 400 }
    );
  }

  // Validate address
  if (!ethers.isAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Ethereum address" }, 
      { status: 400 }
    );
  }

  // Validate score
  const scoreNum = parseInt(score);
  const scoreValidation = validateScore(scoreNum);
  if (!scoreValidation.valid) {
    return NextResponse.json(
      { error: scoreValidation.reason }, 
      { status: 400 }
    );
  }

  try {
    // Check rate limit
    const rateLimit = checkRateLimit(address);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: RATE_LIMIT_WINDOW / 1000 
        }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': MAX_CLAIMS_PER_HOUR.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': (RATE_LIMIT_WINDOW / 1000).toString()
          }
        }
      );
    }

    // Use timestamp or current time
    const ts = timestamp ? parseInt(timestamp) : Date.now();
    const sessionId = generateSessionId(address, scoreNum, ts);

    // Create message to sign
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "bytes32"],
      [address, scoreNum, sessionId]
    );

    // Sign with backend wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    return NextResponse.json({
      success: true,
      address,
      score: scoreNum,
      sessionId,
      signature,
      timestamp: ts,
      remaining: rateLimit.remaining
    }, {
      headers: {
        'X-RateLimit-Limit': MAX_CLAIMS_PER_HOUR.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString()
      }
    });

  } catch (err: any) {
    console.error('Signature generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate signature', details: err.message }, 
      { status: 500 }
    );
  }
}

/**
 * POST endpoint - For actual token minting
 * This is the secure way to mint tokens server-side
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerAddress, score, sessionId, timestamp } = body;

    // Validate required fields
    if (!playerAddress || score === undefined || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: playerAddress, score, sessionId' },
        { status: 400 }
      );
    }

    // Validate address
    if (!ethers.isAddress(playerAddress)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    // Validate score
    const scoreValidation = validateScore(score);
    if (!scoreValidation.valid) {
      return NextResponse.json(
        { error: scoreValidation.reason },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(playerAddress);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Verify timestamp is recent (prevent replay attacks)
    if (timestamp) {
      const timeDiff = Date.now() - timestamp;
      if (timeDiff > 5 * 60 * 1000) { // 5 minutes
        return NextResponse.json(
          { error: 'Session expired. Please play again.' },
          { status: 400 }
        );
      }
    }

    console.log('🎮 Processing claim request...');
    console.log('Player:', playerAddress);
    console.log('Score:', score);
    console.log('Session:', sessionId);

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

    // Check if session already claimed
    const alreadyClaimed = await contract.claimedSessions(sessionId);
    if (alreadyClaimed) {
      return NextResponse.json(
        { error: 'This game session has already been claimed' },
        { status: 400 }
      );
    }

    // Check wallet balance for gas
    const balance = await provider.getBalance(wallet.address);
    if (balance < ethers.parseEther('0.001')) {
      console.error('Low gas balance:', ethers.formatEther(balance));
      return NextResponse.json(
        { error: 'Server wallet low on gas. Please contact support.' },
        { status: 500 }
      );
    }

    // Mint tokens
    console.log('📝 Calling mintReward...');
    const tx = await contract.mintReward(
      playerAddress,
      score / 100, // Convert score to coins (200 score = 2 coins)
      sessionId
    );

    console.log('✉️ Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');

    // Get new balance
    let newBalance = '0';
    try {
      const balance = await contract.balanceOf(playerAddress);
      newBalance = ethers.formatEther(balance);
    } catch (error) {
      console.warn('Could not fetch new balance:', error);
    }

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      tokens: score / 100,
      newBalance,
      message: `Successfully minted ${score / 100} MARIO tokens!`,
      explorerUrl: `https://sepolia.etherscan.io/tx/${receipt.hash}`
    });

  } catch (error: any) {
    console.error('❌ Minting error:', error);

    let errorMessage = 'Failed to mint tokens';
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Server wallet has insufficient funds';
    } else if (error.message?.includes('Only game admins')) {
      errorMessage = 'Server wallet is not authorized as game admin';
    } else if (error.message?.includes('Session already claimed')) {
      errorMessage = 'This game session has already been claimed';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS endpoint - For CORS
 */
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}