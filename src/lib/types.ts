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