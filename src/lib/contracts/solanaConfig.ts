// Solana network and program configuration for game rewards

export const SOLANA_CONFIG = {
  // Network settings
  network: 'devnet' as const,
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  
  // Program IDs (update after deployment)
  gameRewardsProgramId: process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID || 'GameRwrdPrgm11111111111111111111111111111111',
  
  // Token mints for each game (update after initialization)
  tokens: {
    pump: {
      mint: process.env.NEXT_PUBLIC_PUMP_TOKEN_MINT || '',
      symbol: 'PUMP',
      decimals: 9,
    },
    sonic: {
      mint: process.env.NEXT_PUBLIC_SONIC_TOKEN_MINT || '',
      symbol: 'SONIC',
      decimals: 9,
    },
  },
  
  // Cluster endpoint
  clusterEndpoint: 'https://api.devnet.solana.com',
} as const;

export const SOLANA_NETWORK_CONFIG = {
  devnet: {
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
  },
  mainnet: {
    name: 'Solana Mainnet',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
  },
} as const;
