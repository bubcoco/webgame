// Utility functions for game mechanics

import { Coin, Platform } from './types';
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
  
  // Ensure numCoins is between min and max
  const actualNumCoins = Math.min(maxCoins, Math.max(minCoins, numCoins));
  
  // Coin size
  const coinWidth = 20;
  const coinHeight = 20;
  
  // Safe zones (avoid edges and too high/low)
  const safeMarginX = 50;
  const safeMarginY = 80;
  const minY = safeMarginY; // Don't spawn too high
  const maxY = GAME_HEIGHT - 150; // Don't spawn too low (ground area)
  const minX = safeMarginX;
  const maxX = GAME_WIDTH - safeMarginX;
  
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (coins.length < actualNumCoins && attempts < maxAttempts) {
    attempts++;
    
    // Generate random position
    const x = Math.random() * (maxX - minX) + minX;
    const y = Math.random() * (maxY - minY) + minY;
    
    const newCoin: Coin = {
      x,
      y,
      width: coinWidth,
      height: coinHeight,
      collected: false
    };
    
    // Check if coin overlaps with platforms
    const overlapsWithPlatform = platforms.some(platform => 
      isOverlapping(
        newCoin.x, newCoin.y, newCoin.width, newCoin.height,
        platform.x, platform.y, platform.width, platform.height
      )
    );
    
    // Check if coin overlaps with other coins
    const overlapsWithOtherCoins = coins.some(coin =>
      isOverlapping(
        newCoin.x, newCoin.y, newCoin.width, newCoin.height,
        coin.x, coin.y, coin.width, coin.height
      )
    );
    
    // Check if coin is too close to ground platforms
    const tooCloseToGround = platforms.some(platform => {
      if (platform.y >= 450) { // Ground platforms
        return newCoin.y + newCoin.height > platform.y - 50;
      }
      return false;
    });
    
    // If no overlaps and not too close to ground, add coin
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
  // Add some padding to avoid coins too close to platforms
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
  
  // Filter out ground platform
  const airPlatforms = platforms.filter(p => p.y < 450);
  
  for (let i = 0; i < numCoins; i++) {
    if (airPlatforms.length === 0) break;
    
    // Pick a random platform
    const platform = airPlatforms[Math.floor(Math.random() * airPlatforms.length)];
    
    // Place coin above the platform
    const xOffset = Math.random() * (platform.width - coinWidth);
    const yOffset = -50 - Math.random() * 100; // 50-150 pixels above platform
    
    const coin: Coin = {
      x: platform.x + xOffset,
      y: platform.y + yOffset,
      width: coinWidth,
      height: coinHeight,
      collected: false
    };
    
    // Check if coin doesn't overlap with existing coins
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
  const platformCoins = Math.floor(totalCoins * 0.6); // 60% near platforms
  const randomCoins = totalCoins - platformCoins; // 40% random
  
  const nearPlatforms = generateCoinsNearPlatforms(platformCoins, platforms);
  const random = generateRandomCoins(randomCoins, platforms);
  
  return [...nearPlatforms, ...random];
}