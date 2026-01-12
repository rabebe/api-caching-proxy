import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL not set');

const redis = new Redis(redisUrl);

// Configurable limits
const SOFT_LIMIT = 5;   // cached request limit per IP per minute
const HARD_LIMIT = 3;   // API call limit per IP per minute
const WINDOW_MS = 60 * 1000; // 1 minute

export interface RateLimitResult {
  allowed: boolean;
  reason?: 'soft_limit' | 'hard_limit';
}

/**
 * Increment a Redis counter for a given key
 */
async function incrementCounter(key: string, limit: number): Promise<boolean> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.pexpire(key, WINDOW_MS); // start the window
  }
  return count <= limit;
}

/**
 * Hybrid rate limiter
 * @param ip - user identifier
 * @param isApiCall - true if request will hit external API
 */
export async function allowRequest(ip: string, isApiCall = false): Promise<RateLimitResult> {
  const softKey = `rate_soft:${ip}`;
  const hardKey = `rate_hard:${ip}`;

  if (isApiCall) {
    // Count API call only
    const allowed = await incrementCounter(hardKey, HARD_LIMIT);
    return { allowed, reason: allowed ? undefined : 'hard_limit' };
  } else {
    // Count cached requests
    const allowed = await incrementCounter(softKey, SOFT_LIMIT);
    return { allowed, reason: allowed ? undefined : 'soft_limit' };
  }
}
