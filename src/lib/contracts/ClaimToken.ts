import { ethers } from 'ethers';
import { ClaimResponse } from '../types';

// Mario Game Token Contract ABI
const contractABI = [
  "function mintReward(address player, uint256 coinsCollected, bytes32 sessionId) external",
  "function balanceOf(address account) view returns (uint256)",
  "function totalEarned(address account) view returns (uint256)",
  "function rewardRate() view returns (uint256)",
  "function getPlayerStats(address player) view returns (uint256 balance, uint256 totalTokensEarned)",
  "event TokensMinted(address indexed player, uint256 coins, uint256 tokens, bytes32 sessionId)"
];

// Your deployed contract address
const contractAddress = '0xE9764543bF2E5a266dD6b36E23f9875B3cF6e3c5'; 

interface ClaimTokenParams {
  score: number;
  playerAddress: string;
  signer: ethers.Signer;
  setIsClaiming: (claiming: boolean) => void;
}

/**
 * Generate a unique session ID for the game session
 */
function generateSessionId(playerAddress: string, score: number, timestamp: number): string {
  const data = ethers.solidityPacked(
    ['address', 'uint256', 'uint256'],
    [playerAddress, score, timestamp]
  );
  return ethers.keccak256(data);
}

/**
 * Verify the claim with backend server (optional)
 */
async function verifyClaimWithBackend(
  playerAddress: string,
  score: number,
  sessionId: string
): Promise<{ valid: boolean; signature?: string }> {
  try {
    const response = await fetch('/api/verify-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerAddress,
        score,
        sessionId,
      }),
    });

    if (!response.ok) {
      console.warn('Backend verification not available, proceeding without it');
      return { valid: true }; // Allow claim even if backend verification fails
    }

    return await response.json();
  } catch (error) {
    console.warn('Backend verification error, proceeding without it:', error);
    return { valid: true }; // Allow claim even if backend verification fails
  }
}

/**
 * Claim tokens based on game score
 */
export async function claimTokens({
  score,
  playerAddress,
  signer,
  setIsClaiming
}: ClaimTokenParams): Promise<ClaimResponse> {
  
  if (!contractAddress) {
    return { 
      success: false, 
      error: 'Contract address not configured.' 
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
    // Generate unique session ID
    const timestamp = Date.now();
    const sessionId = generateSessionId(playerAddress, score, timestamp);

    console.log('🎮 Claiming tokens...');
    console.log('Player:', playerAddress);
    console.log('Score:', score);
    console.log('Session ID:', sessionId);

    // Verify with backend (optional)
    const verification = await verifyClaimWithBackend(playerAddress, score, sessionId);
    if (!verification.valid) {
      return { 
        success: false, 
        error: 'Score verification failed.' 
      };
    }

    // Connect to the contract
    const gameTokenContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    // Check current balance
    try {
      const balanceBefore = await gameTokenContract.balanceOf(playerAddress);
      console.log('Balance before:', ethers.formatEther(balanceBefore), 'MARIO');
    } catch (error) {
      console.warn('Could not fetch balance:', error);
    }

    // Call mintReward function
    console.log(`📝 Minting ${score} tokens...`);
    
    const tx = await gameTokenContract.mintReward(
      playerAddress,
      score,
      sessionId
    );

    console.log('✉️ Transaction sent:', tx.hash);

    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');

    // Check new balance
    try {
      const balanceAfter = await gameTokenContract.balanceOf(playerAddress);
      const tokensEarned = balanceAfter - await gameTokenContract.balanceOf(playerAddress);
      console.log('Balance after:', ethers.formatEther(balanceAfter), 'MARIO');
      
      return {
        success: true,
        txHash: receipt.hash,
        tokens: score
      };
    } catch (error) {
      // Balance check failed, but transaction succeeded
      return {
        success: true,
        txHash: receipt.hash,
        tokens: score
      };
    }

  } catch (error: any) {
    console.error('❌ Claim failed:', error);
    
    let errorMsg = 'Transaction failed. Please try again.';
    
    if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      errorMsg = 'Transaction was rejected by user.';
    } else if (error.message?.includes('Only game admins')) {
      errorMsg = 'Only authorized game admins can mint tokens. Please contact support.';
    } else if (error.message?.includes('Session already claimed')) {
      errorMsg = 'This game session has already been claimed.';
    } else if (error.message?.includes('insufficient funds')) {
      errorMsg = 'Insufficient funds for gas fees. Please add some ETH to your wallet.';
    } else if (error.message?.includes('user rejected')) {
      errorMsg = 'Transaction was rejected.';
    } else if (error.message) {
      // Include actual error message for debugging
      errorMsg = error.message;
    }
    
    return { success: false, error: errorMsg };

  } finally {
    setIsClaiming(false);
  }
}

/**
 * Get player's token statistics
 */
export async function getPlayerStats(
  playerAddress: string,
  provider: ethers.Provider
): Promise<{ balance: string; totalEarned: string } | null> {
  
  try {
    const gameTokenContract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    const stats = await gameTokenContract.getPlayerStats(playerAddress);
    
    return {
      balance: ethers.formatEther(stats.balance || stats[0]),
      totalEarned: ethers.formatEther(stats.totalTokensEarned || stats[1])
    };

  } catch (error) {
    console.error('Failed to fetch player stats:', error);
    return null;
  }
}

/**
 * Get current reward rate
 */
export async function getRewardRate(provider: ethers.Provider): Promise<string> {
  try {
    const gameTokenContract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    const rate = await gameTokenContract.rewardRate();
    return ethers.formatEther(rate);

  } catch (error) {
    console.error('Failed to fetch reward rate:', error);
    return '1';
  }
}