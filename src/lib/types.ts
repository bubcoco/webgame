// ============= Game Entity Types =============
export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isJumping: boolean;
  onGround: boolean;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Coin {
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  direction: number;
  isDefeated: boolean;
}

export interface Keys {
  ArrowRight: boolean;
  ArrowLeft: boolean;
  Space: boolean;
}

// ============= Wallet Types =============
export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  balance: string;
}

// ============= Blockchain Claim Types =============
export interface ClaimRequest {
  score: number;
  playerAddress: string;
}

export interface ClaimResponse {
  success: boolean;
  txHash?: string;
  tokens?: number;
  error?: string;
}

export type ClaimStatus = 'idle' | 'claiming' | 'success' | 'error';

// ============= Player Stats (Blockchain) =============
export interface PlayerStats {
  balance: string;
  totalEarned: string;
  gamesPlayed?: number;
  lastClaimTime?: number;
}

// ============= Game Session Types =============
export interface GameSession {
  id: string;
  playerAddress: string;
  score: number;
  coinsCollected: number;
  startTime: number;
  endTime: number;
  claimed: boolean;
}

export interface GameStats {
  currentScore: number;
  coinsCollected: number;
  lives: number;
  level: number;
}

// ============= API Request/Response Types =============
export interface MintTokensRequest {
  playerAddress: string;
  score: number;
  sessionId: string;
  timestamp: number;
  gameData?: string;
}

export interface MintTokensResponse {
  success: boolean;
  txHash?: string;
  tokens?: number;
  error?: string;
  message?: string;
}

// ============= Contract Configuration Types =============
export interface ContractConfig {
  address: string;
  abi: readonly string[];
}

export interface NetworkConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  blockExplorer: string;
}

// ============= Game Level Configuration =============
export interface LevelConfig {
  platforms: Platform[];
  coins: Coin[];
  enemies: Enemy[];
  startPosition: { x: number; y: number };
  backgroundColor: string;
}

// ============= Window Ethereum Type (for TypeScript) =============
declare global {
  interface Window {
    ethereum?: any;
  }
}