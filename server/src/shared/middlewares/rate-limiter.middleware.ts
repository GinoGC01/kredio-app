import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateLimitEntry>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now > entry.resetAt) {
      attempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const loginRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = attempts.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000 / 60);
      res.status(429).json({
        error: `Too many login attempts. Try again in ${retryAfter} minutes.`,
      });
      return;
    }
    entry.count++;
  } else {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  next();
};
