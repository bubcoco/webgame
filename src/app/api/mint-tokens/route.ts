import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Configuration
const PRIVATE_KEY = process.env.GAME_ADMIN_PRIVATE_KEY!; // Store securely in .env
const RPC_URL = process.env.RPC_URL!; // e.g., Alchemy, Infura
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

const contractABI = [
  "function mintReward(address player, uint256 coinsCollected, bytes32 sessionId) external",
  "function claimedSessions(bytes32) view returns (bool)"
];

// In-memory session tracking (use Redis/Database in production)
const processedSessions = new Set<string>();

interface MintRequest {
  playerAddress: string;
  score: number;
  sessionId: string;
  gameData?: string; // Optional: encrypted game data for validation
}

/**
 * Validate game score (implement your own validation logic)
 */
function validateScore(score: number, gameData?: string): boolean {
  // TODO: Implement game validation logic
  // - Check if score is realistic based on game duration
  // - Verify game data signature
  // - Check anti-cheat measures
  
  if (score < 0 || score > 1000) {
    return false; // Unrealistic score
  }
  
  return true;
}

/**
 * Generate session ID (should match frontend)
 */
function generateSessionId(playerAddress: string, score: number, timestamp: number): string {
  const data = ethers.solidityPacked(
    ['address', 'uint256', 'uint256'],
    [playerAddress, score, timestamp]
  );
  return ethers.keccak256(data);
}

export async function POST(request: NextRequest) {
  try {
    const body: MintRequest = await request.json();
    const { playerAddress, score, sessionId, gameData } = body;

    // Validation
    if (!ethers.isAddress(playerAddress)) {
      return NextResponse.json(
        { error: 'Invalid player address' },
        { status: 400 }
      );
    }

    if (score <= 0) {
      return NextResponse.json(
        { error: 'Score must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if session already processed
    if (processedSessions.has(sessionId)) {
      return NextResponse.json(
        { error: 'Session already claimed' },
        { status: 400 }
      );
    }

    // Validate score
    if (!validateScore(score, gameData)) {
      console.warn(`Invalid score detected: ${score} from ${playerAddress}`);
      return NextResponse.json(
        { error: 'Invalid game data' },
        { status: 400 }
      );
    }

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

    // Check if session already claimed on-chain
    const alreadyClaimed = await contract.claimedSessions(sessionId);
    if (alreadyClaimed) {
      return NextResponse.json(
        { error: 'Session already claimed on blockchain' },
        { status: 400 }
      );
    }

    // Mint tokens
    console.log(`Minting ${score} tokens for ${playerAddress}`);
    const tx = await contract.mintReward(playerAddress, score, sessionId);
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);

    // Mark session as processed
    processedSessions.add(sessionId);

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
      tokens: score,
      message: `Successfully minted ${score} tokens!`
    });

  } catch (error: any) {
    console.error('Minting error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to mint tokens',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check claim status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
    
    const claimed = await contract.claimedSessions(sessionId);
    
    return NextResponse.json({
      sessionId,
      claimed,
      processedLocally: processedSessions.has(sessionId)
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check session status' },
      { status: 500 }
    );
  }
}