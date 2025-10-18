
import { getRedisClient } from './redis';

export async function checkRateLimit(
  walletAddress: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  
  const redis = await getRedisClient();
  const key = `ratelimit:${walletAddress}`;
  
  const current = await redis.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count >= maxRequests) {
    const ttl = await redis.ttl(key);
    return {
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + (ttl * 1000)
    };
  }
  
  await redis.incr(key);
  
  if (count === 0) {
    await redis.expire(key, Math.floor(windowMs / 1000));
  }
  
  return {
    allowed: true,
    remaining: maxRequests - count - 1,
    resetTime: Date.now() + windowMs
  };
}