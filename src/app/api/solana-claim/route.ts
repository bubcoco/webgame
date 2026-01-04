// src/app/api/solana-claim/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Configuration
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_CLAIMS_PER_HOUR = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function checkRateLimit(address: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(address);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(address, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_CLAIMS_PER_HOUR - 1 };
  }

  if (record.count >= MAX_CLAIMS_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_CLAIMS_PER_HOUR - record.count };
}

function validateScore(score: number): { valid: boolean; reason?: string } {
  if (score < 0) return { valid: false, reason: 'Score cannot be negative' };
  if (score > 10000) return { valid: false, reason: 'Score too high' };
  if (score % 100 !== 0) return { valid: false, reason: 'Invalid score format' };
  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerAddress, score, gameType, sessionId, timestamp } = body;

    // Validate required fields
    if (!playerAddress || score === undefined || !gameType || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: playerAddress, score, gameType, sessionId' },
        { status: 400 }
      );
    }

    // Validate score
    const scoreValidation = validateScore(score);
    if (!scoreValidation.valid) {
      return NextResponse.json({ error: scoreValidation.reason }, { status: 400 });
    }

    // Check rate limit
    const rateLimit = checkRateLimit(playerAddress);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Verify timestamp
    if (timestamp) {
      const timeDiff = Date.now() - timestamp;
      if (timeDiff > 5 * 60 * 1000) {
        return NextResponse.json({ error: 'Session expired.' }, { status: 400 });
      }
    }

    console.log('🎮 Processing Solana claim...');
    console.log('Player:', playerAddress);
    console.log('Score:', score);
    console.log('Game:', gameType);

    // For demo, simulate successful claim
    // In production, this would call the Solana program
    const tokens = Math.floor(score / 100);
    
    // Generate mock signature
    const mockSignature = Array.from({ length: 88 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
        Math.floor(Math.random() * 62)
      ]
    ).join('');

    console.log('✅ Solana claim processed (demo mode)');
    console.log('Tokens:', tokens);

    return NextResponse.json({
      success: true,
      signature: mockSignature,
      tokens,
      message: `Successfully claimed ${tokens} ${gameType.toUpperCase()} tokens on Solana Devnet!`,
      explorerUrl: `https://explorer.solana.com/tx/${mockSignature}?cluster=devnet`,
    });

  } catch (error: any) {
    console.error('❌ Solana claim error:', error);

    return NextResponse.json(
      { error: 'Failed to process Solana claim', details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
