import { NextResponse } from 'next/server';

export async function GET() {
  const hasPrivateKey = !!process.env.GAME_ADMIN_PRIVATE_KEY;
  
  return NextResponse.json({
    hasPrivateKey,
    privateKeyLength: process.env.GAME_ADMIN_PRIVATE_KEY?.length || 0,
    // Don't expose the actual key!
    nodeEnv: process.env.NODE_ENV
  });
}