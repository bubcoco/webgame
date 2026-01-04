// src/lib/contracts/claimSolana.ts
// Client-side Solana utilities - no direct @solana/web3.js imports to avoid build issues

import { SOLANA_CONFIG } from './solanaConfig';

interface ClaimSolanaParams {
  playerAddress: string;
  score: number;
  gameType: 'pump' | 'sonic';
}

interface ClaimSolanaResponse {
  success: boolean;
  signature?: string;
  tokens?: number;
  error?: string;
}

/**
 * Generate session ID for Solana claims (matches program logic)
 */
function generateSessionId(playerAddress: string, score: number, timestamp: number): Uint8Array {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${playerAddress}:${score}:${timestamp}`);
  
  // Simple hash using XOR
  const hashBuffer = new Uint8Array(32);
  for (let i = 0; i < data.length; i++) {
    hashBuffer[i % 32] ^= data[i];
  }
  
  return hashBuffer;
}

/**
 * Check if Phantom wallet is available
 */
export function isPhantomInstalled(): boolean {
  return typeof window !== 'undefined' && !!(window as any).phantom?.solana?.isPhantom;
}

/**
 * Get Phantom wallet provider
 */
export function getPhantomProvider() {
  if (typeof window === 'undefined') return null;
  const phantom = (window as any).phantom?.solana;
  if (phantom?.isPhantom) return phantom;
  return null;
}

/**
 * Connect to Phantom wallet
 */
export async function connectPhantom(): Promise<string | null> {
  const phantom = getPhantomProvider();
  if (!phantom) {
    console.error('Phantom wallet not found');
    return null;
  }
  
  try {
    const response = await phantom.connect();
    return response.publicKey.toString();
  } catch (error) {
    console.error('Phantom connection failed:', error);
    return null;
  }
}

/**
 * Claim rewards on Solana via backend API
 */
export async function claimSolanaReward({
  playerAddress,
  score,
  gameType,
}: ClaimSolanaParams): Promise<ClaimSolanaResponse> {
  if (score <= 0) {
    return { success: false, error: 'Score must be greater than 0' };
  }

  const tokens = Math.floor(score / 100);
  if (tokens <= 0) {
    return { success: false, error: 'Score too low for token reward' };
  }

  try {
    const timestamp = Date.now();
    const sessionId = generateSessionId(playerAddress, score, timestamp);
    
    console.log('🌐 Claiming Solana reward...');
    console.log('Player:', playerAddress);
    console.log('Score:', score);
    console.log('Game:', gameType);
    console.log('Tokens to claim:', tokens);

    const response = await fetch('/api/solana-claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerAddress,
        score,
        gameType,
        sessionId: Array.from(sessionId),
        timestamp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Solana claim failed');
    }

    console.log('✅ Solana claim successful!');
    console.log('Signature:', data.signature);
    
    return {
      success: true,
      signature: data.signature,
      tokens: data.tokens,
    };
  } catch (error: any) {
    console.error('❌ Solana claim failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to claim Solana reward',
    };
  }
}

/**
 * Get player's token balance on Solana (placeholder)
 */
export async function getSolanaBalance(
  playerAddress: string,
  gameType: 'pump' | 'sonic'
): Promise<number> {
  // In production, would fetch via RPC
  // For now, return 0
  console.log('Getting balance for:', playerAddress, gameType);
  return 0;
}

/**
 * Get Solana explorer URL for a transaction
 */
export function getSolanaExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}
