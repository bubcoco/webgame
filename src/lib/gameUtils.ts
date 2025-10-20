// Utility functions for game mechanics

import { Coin, Platform, Enemy } from './types';
import { GAME_WIDTH, GAME_HEIGHT } from '@/components/SuperJumpQuest';

/**
 * Generate random coins that don't overlap with platforms
 * @param numCoins - Number of coins to generate (1-20)
 * @param platforms - Array of platforms to avoid
 * @returns Array of coins with random positions
 */
export function generateRandomCoins(
  numCoins: number,
  platforms: Platform[]
): Coin[] {
  const coins: Coin[] = [];
  const minCoins = 5;
  const maxCoins = 20;
  
  const actualNumCoins = Math.min(maxCoins, Math.max(minCoins, numCoins));
  
  const coinWidth = 20;
  const coinHeight = 20;
  
  const safeMarginX = 50;
  const safeMarginY = 80;
  const minY = safeMarginY;
  const maxY = GAME_HEIGHT - 150;
  const minX = safeMarginX;
  const maxX = GAME_WIDTH - safeMarginX;
  
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (coins.length < actualNumCoins && attempts < maxAttempts) {
    attempts++;
    
    const x = Math.random() * (maxX - minX) + minX;
    const y = Math.random() * (maxY - minY) + minY;
    
    const newCoin: Coin = {
      x,
      y,
      width: coinWidth,
      height: coinHeight,
      collected: false
    };
    
    const overlapsWithPlatform = platforms.some(platform => 
      isOverlapping(
        newCoin.x, newCoin.y, newCoin.width, newCoin.height,
        platform.x, platform.y, platform.width, platform.height
      )
    );
    
    const overlapsWithOtherCoins = coins.some(coin =>
      isOverlapping(
        newCoin.x, newCoin.y, newCoin.width, newCoin.height,
        coin.x, coin.y, coin.width, coin.height
      )
    );
    
    const tooCloseToGround = platforms.some(platform => {
      if (platform.y >= 450) {
        return newCoin.y + newCoin.height > platform.y - 50;
      }
      return false;
    });
    
    if (!overlapsWithPlatform && !overlapsWithOtherCoins && !tooCloseToGround) {
      coins.push(newCoin);
    }
  }
  
  console.log(`✨ Generated ${coins.length} random coins`);
  return coins;
}

/**
 * Check if two rectangles overlap
 */
function isOverlapping(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  const padding = 30;
  
  return !(
    x1 + w1 + padding < x2 ||
    x1 > x2 + w2 + padding ||
    y1 + h1 + padding < y2 ||
    y1 > y2 + h2 + padding
  );
}

/**
 * Generate a random number of coins between min and max
 */
export function getRandomCoinCount(min: number = 5, max: number = 20): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate coins near platforms for better gameplay
 */
export function generateCoinsNearPlatforms(
  numCoins: number,
  platforms: Platform[]
): Coin[] {
  const coins: Coin[] = [];
  const coinWidth = 20;
  const coinHeight = 20;
  
  const airPlatforms = platforms.filter(p => p.y < 450);
  
  for (let i = 0; i < numCoins; i++) {
    if (airPlatforms.length === 0) break;
    
    const platform = airPlatforms[Math.floor(Math.random() * airPlatforms.length)];
    
    const xOffset = Math.random() * (platform.width - coinWidth);
    const yOffset = -50 - Math.random() * 100;
    
    const coin: Coin = {
      x: platform.x + xOffset,
      y: platform.y + yOffset,
      width: coinWidth,
      height: coinHeight,
      collected: false
    };
    
    const overlaps = coins.some(c => 
      Math.abs(c.x - coin.x) < 40 && Math.abs(c.y - coin.y) < 40
    );
    
    if (!overlaps) {
      coins.push(coin);
    }
  }
  
  console.log(`✨ Generated ${coins.length} coins near platforms`);
  return coins;
}

/**
 * Mix of random and platform-based coins for best gameplay
 */
export function generateMixedCoins(
  platforms: Platform[]
): Coin[] {
  const totalCoins = getRandomCoinCount(8, 20);
  const platformCoins = Math.floor(totalCoins * 0.6);
  const randomCoins = totalCoins - platformCoins;
  
  const nearPlatforms = generateCoinsNearPlatforms(platformCoins, platforms);
  const random = generateRandomCoins(randomCoins, platforms);
  
  return [...nearPlatforms, ...random];
}

/**
 * Generate random enemies on platforms
 * @param platforms - Array of platforms
 * @returns Array of enemies with random positions
 */
export function generateRandomEnemies(platforms: Platform[]): Enemy[] {
  const enemies: Enemy[] = [];
  const minEnemies = 2;
  const maxEnemies = 5;
  
  const numEnemies = Math.floor(Math.random() * (maxEnemies - minEnemies + 1)) + minEnemies;
  
  // Filter out ground platform and get platforms suitable for enemies
  const suitablePlatforms = platforms.filter(p => 
    p.y < 480 && p.width >= 100 // Not ground, and wide enough
  );
  
  if (suitablePlatforms.length === 0) {
    console.warn('No suitable platforms for enemies');
    return enemies;
  }
  
  for (let i = 0; i < numEnemies; i++) {
    // Pick random platform
    const platform = suitablePlatforms[Math.floor(Math.random() * suitablePlatforms.length)];
    
    // Random position on platform
    const enemyWidth = 30;
    const enemyHeight = 30;
    const maxX = platform.x + platform.width - enemyWidth - 20;
    const minX = platform.x + 20;
    
    const x = Math.random() * (maxX - minX) + minX;
    const y = platform.y - enemyHeight;
    
    // Random direction
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    // Random speed (0.5 to 1.5)
    const speed = 0.5 + Math.random();
    
    const enemy: Enemy = {
      x,
      y,
      width: enemyWidth,
      height: enemyHeight,
      vx: speed,
      direction,
      isDefeated: false
    };
    
    // Check if too close to other enemies
    const tooClose = enemies.some(e => 
      Math.abs(e.x - enemy.x) < 100 && Math.abs(e.y - enemy.y) < 50
    );
    
    if (!tooClose) {
      enemies.push(enemy);
    }
  }
  
  console.log(`👾 Generated ${enemies.length} random enemies`);
  return enemies;
}

/**
 * Generate random platforms (obstacles)
 * @param numPlatforms - Number of extra platforms to generate
 * @returns Array of platform obstacles
 */
export function generateRandomPlatforms(numPlatforms: number = 3): Platform[] {
  const platforms: Platform[] = [];
  
  // Always include ground
  platforms.push({ x: 0, y: 500, width: 1600, height: 100 });
  
  const minExtraPlatforms = 3;
  const maxExtraPlatforms = 8;
  const actualNum = Math.min(maxExtraPlatforms, Math.max(minExtraPlatforms, numPlatforms));
  
  const TILE_SIZE = 20;
  const minY = 150;
  const maxY = 450;
  const minX = 100;
  const maxX = 1400;
  
  let attempts = 0;
  const maxAttempts = 100;
  
  while (platforms.length - 1 < actualNum && attempts < maxAttempts) {
    attempts++;
    
    // Random size
    const width = 100 + Math.floor(Math.random() * 150);
    const height = TILE_SIZE;
    
    // Random position
    const x = Math.random() * (maxX - minX - width) + minX;
    const y = Math.random() * (maxY - minY) + minY;
    
    // Round to nice values
    const roundedY = Math.round(y / 50) * 50;
    const roundedX = Math.round(x / 50) * 50;
    
    const newPlatform: Platform = {
      x: roundedX,
      y: roundedY,
      width,
      height
    };
    
    // Check if overlaps with existing platforms
    const overlaps = platforms.some(p => 
      !(newPlatform.x + newPlatform.width < p.x ||
        newPlatform.x > p.x + p.width ||
        newPlatform.y + newPlatform.height < p.y ||
        newPlatform.y > p.y + p.height)
    );
    
    // Check if too close vertically
    const tooCloseVertically = platforms.some(p =>
      Math.abs(p.y - newPlatform.y) < 80 &&
      Math.abs(p.x - newPlatform.x) < 200
    );
    
    if (!overlaps && !tooCloseVertically) {
      platforms.push(newPlatform);
    }
  }
  
  console.log(`🧱 Generated ${platforms.length - 1} random platforms`);
  return platforms;
}

/**
 * Generate a complete random level
 */
export function generateRandomLevel(): {
  platforms: Platform[];
  coins: Coin[];
  enemies: Enemy[];
} {
  // Generate platforms first
  const platforms = generateRandomPlatforms();
  
  // Generate coins based on platforms
  const coins = generateMixedCoins(platforms);
  
  // Generate enemies based on platforms
  const enemies = generateRandomEnemies(platforms);
  
  console.log('🎮 Generated complete random level');
  console.log(`  - Platforms: ${platforms.length - 1} (+ ground)`);
  console.log(`  - Coins: ${coins.length}`);
  console.log(`  - Enemies: ${enemies.length}`);
  
  return { platforms, coins, enemies };
}