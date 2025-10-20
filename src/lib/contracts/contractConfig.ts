export const CONTRACT_CONFIG = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
  abi: [
    "function mintReward(address player, uint256 coinsCollected, bytes32 sessionId) external",
    "function balanceOf(address account) view returns (uint256)",
    "function totalEarned(address account) view returns (uint256)",
    "function rewardRate() view returns (uint256)",
    "function getPlayerStats(address player) view returns (uint256 balance, uint256 totalTokensEarned)",
    "event TokensMinted(address indexed player, uint256 coins, uint256 tokens, bytes32 sessionId)"
  ]
} as const;

export const SEPOLIA_NETWORK_CONFIG = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111, // Sepolia
  chainName: 'Sepolia',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
  blockExplorer: 'https://sepolia.etherscan.io'
} as const;

export const AMOY_NETWORK_CONFIG = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111, // AMOY
  chainName: 'Amoy',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
  blockExplorer: 'https://amoy.polygonscan.com/'
} as const;

export const TOKEN_CONFIG = {
  name: 'Game Token',
  symbol: 'GEMS',
  decimals: 18
} as const;