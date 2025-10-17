// src/lib/contracts/claimTokenBackend.ts
import { ethers } from 'ethers';
import { ClaimResponse } from '../types';

interface ClaimTokenParams {
  score: number;
  playerAddress: string;
  setIsClaiming: (claiming: boolean) => void;
}

/**
 * Generate session ID (must match backend)
 */
function generateSessionId(playerAddress: string, score: number, timestamp: number): string {
  const data = ethers.solidityPacked(
    ['address', 'uint256', 'uint256'],
    [playerAddress, score, timestamp]
  );
  return ethers.keccak256(data);
}

/**
 * Claim tokens via backend API (RECOMMENDED - More Secure)
 * This method doesn't require the player's wallet to be a game admin
 */
export async function claimTokensViaBackend({
  score,
  playerAddress,
  setIsClaiming
}: ClaimTokenParams): Promise<ClaimResponse> {
  
  if (score <= 0) {
    return { 
      success: false, 
      error: 'You need to collect at least 1 coin!' 
    };
  }

  setIsClaiming(true);

  try {
    const timestamp = Date.now();
    const sessionId = generateSessionId(playerAddress, score, timestamp);

    console.log('🎮 Claiming tokens via backend...');
    console.log('Player:', playerAddress);
    console.log('Score:', score);
    console.log('Session:', sessionId);

    // Call backend API to mint tokens
    const response = await fetch('/api/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerAddress,
        score,
        sessionId,
        timestamp
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to claim tokens');
    }

    console.log('✅ Claim successful!');
    console.log('TX Hash:', data.txHash);
    console.log('Tokens:', data.tokens);

    return {
      success: true,
      txHash: data.txHash,
      tokens: data.tokens
    };

  } catch (error: any) {
    console.error('❌ Claim failed:', error);
    
    let errorMsg = 'Failed to claim tokens. Please try again.';
    
    if (error.message?.includes('Rate limit')) {
      errorMsg = 'Too many claims. Please wait before trying again.';
    } else if (error.message?.includes('already been claimed')) {
      errorMsg = 'This game session has already been claimed.';
    } else if (error.message?.includes('Session expired')) {
      errorMsg = 'Session expired. Please play again.';
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    return { success: false, error: errorMsg };

  } finally {
    setIsClaiming(false);
  }
}

/**
 * Get verification signature from backend (optional)
 * Use this if you want to verify scores before allowing claim
 */
export async function getClaimSignature(
  playerAddress: string,
  score: number
): Promise<{ sessionId: string; signature: string } | null> {
  try {
    const timestamp = Date.now();
    const response = await fetch(
      `/api/claim?address=${playerAddress}&score=${score}&timestamp=${timestamp}`
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to get signature');
    }

    const data = await response.json();
    return {
      sessionId: data.sessionId,
      signature: data.signature
    };

  } catch (error: any) {
    console.error('Failed to get claim signature:', error);
    return null;
  }
}

/**
 * Claim tokens directly (requires player wallet to be game admin)
 * This is the old method - less secure
 */
export async function claimTokensDirect({
  score,
  playerAddress,
  signer,
  setIsClaiming
}: ClaimTokenParams & { signer: ethers.Signer }): Promise<ClaimResponse> {
  
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
  const contractABI = [
    "function mintReward(address player, uint256 coinsCollected, bytes32 sessionId) external",
  ];

  if (!CONTRACT_ADDRESS) {
    return { 
      success: false, 
      error: 'Contract address not configured' 
    };
  }

  if (score <= 0) {
    return { 
      success: false, 
      error: 'You need to collect at least 1 coin!' 
    };
  }

  setIsClaiming(true);

  try {
    const timestamp = Date.now();
    const sessionId = generateSessionId(playerAddress, score, timestamp);

    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
    
    console.log('📝 Minting tokens directly...');
    const tx = await contract.mintReward(playerAddress, score / 100, sessionId);
    
    console.log('✉️ Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');

    return {
      success: true,
      txHash: receipt.hash,
      tokens: score / 100
    };

  } catch (error: any) {
    console.error('❌ Direct claim failed:', error);
    
    let errorMsg = 'Transaction failed';
    
    if (error.message?.includes('Only game admins')) {
      errorMsg = 'Your wallet is not authorized. Please use the backend claim method.';
    } else if (error.message?.includes('Session already claimed')) {
      errorMsg = 'This game session has already been claimed.';
    } else if (error.code === 'ACTION_REJECTED') {
      errorMsg = 'Transaction was rejected.';
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    return { success: false, error: errorMsg };

  } finally {
    setIsClaiming(false);
  }
}