import { ethers } from 'ethers';

// Mario Game Token Contract ABI (only the functions we need)
const contractABI = [
  "function mintReward(address player, uint256 coinsCollected, bytes32 sessionId) external",
  "function balanceOf(address account) view returns (uint256)",
  "function totalEarned(address account) view returns (uint256)",
  "function rewardRate() view returns (uint256)",
  "function getPlayerStats(address player) view returns (uint256 balance, uint256 totalTokensEarned)",
  "event TokensMinted(address indexed player, uint256 coins, uint256 tokens, bytes32 sessionId)"
];

const contractAddress = '0x...'; 

interface ClaimTokenParams {
  score: number;
  playerAddress: string;
  signer: ethers.Signer;
  setIsClaiming: (claiming: boolean) => void;
}

/**
 * Generate a unique session ID for the game session
 * This prevents duplicate claims
 */
function generateSessionId(playerAddress: string, score: number, timestamp: number): string {
  const data = ethers.solidityPacked(
    ['address', 'uint256', 'uint256'],
    [playerAddress, score, timestamp]
  );
  return ethers.keccak256(data);
}

/**
 * Verify the claim with backend server
 * This prevents cheating by validating the score server-side
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
      throw new Error('Verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Backend verification error:', error);
    return { valid: false };
  }
}

/**
 * Claim tokens based on game score
 * This function should be called when player wants to claim their rewards
 */
export async function claimTokens({
  score,
  playerAddress,
  signer,
  setIsClaiming
}: ClaimTokenParams): Promise<boolean> {
  
  if (!contractAddress || contractAddress === '0x...') {
    alert('Contract address not configured. Please deploy the contract first.');
    return false;
  }

  if (score <= 0) {
    alert('You need to collect at least 1 coin to claim tokens!');
    return false;
  }

  setIsClaiming(true);

  try {
    // Generate unique session ID
    const timestamp = Date.now();
    const sessionId = generateSessionId(playerAddress, score, timestamp);

    console.log('Generated session ID:', sessionId);

    // Step 1: Verify with backend (optional but HIGHLY recommended for production)
    // Uncomment this in production to prevent cheating
    /*
    const verification = await verifyClaimWithBackend(playerAddress, score, sessionId);
    if (!verification.valid) {
      alert('Score verification failed. Please try again.');
      return false;
    }
    */

    // Step 2: Connect to the contract
    const gameTokenContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    // Step 3: Check current balance before claiming
    const balanceBefore = await gameTokenContract.balanceOf(playerAddress);
    console.log('Balance before claim:', ethers.formatEther(balanceBefore), 'MARIO');

    // Step 4: Call mintReward function
    // Note: This requires the connected wallet to be a gameAdmin
    // In production, you should call this from your backend server
    console.log(`Attempting to mint tokens for ${score} coins collected...`);
    
    const tx = await gameTokenContract.mintReward(
      playerAddress,
      score,
      sessionId
    );

    console.log('Transaction sent:', tx.hash);
    alert('Transaction submitted! Waiting for confirmation...');

    // Step 5: Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    // Step 6: Check new balance
    const balanceAfter = await gameTokenContract.balanceOf(playerAddress);
    const tokensEarned = balanceAfter - balanceBefore;

    console.log('Balance after claim:', ethers.formatEther(balanceAfter), 'MARIO');
    console.log('Tokens earned:', ethers.formatEther(tokensEarned), 'MARIO');

    alert(`Successfully claimed ${ethers.formatEther(tokensEarned)} MARIO tokens!`);
    
    return true;

  } catch (error: any) {
    console.error('Claim failed:', error);
    
    // Handle specific errors
    if (error.code === 'ACTION_REJECTED') {
      alert('Transaction was rejected by user.');
    } else if (error.message.includes('Only game admins')) {
      alert('Error: Only authorized game admins can mint tokens. Please contact support.');
    } else if (error.message.includes('Session already claimed')) {
      alert('This game session has already been claimed!');
    } else if (error.message.includes('insufficient funds')) {
      alert('Insufficient funds for gas fees. Please add some ETH to your wallet.');
    } else {
      alert('Transaction failed. Please try again or check console for details.');
    }
    
    return false;

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
      balance: ethers.formatEther(stats.balance),
      totalEarned: ethers.formatEther(stats.totalTokensEarned)
    };

  } catch (error) {
    console.error('Failed to fetch player stats:', error);
    return null;
  }
}

/**
 * Get current reward rate (tokens per coin)
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