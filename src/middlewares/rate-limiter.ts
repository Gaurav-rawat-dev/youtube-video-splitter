import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

const limiter = new RateLimiterMemory({
  points: 5, // requests
  duration: 60, // per minute
});

export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore
    await limiter.consume(req.ip);
    next();
  } catch {
    res.status(429).json({ message: 'Too Many Requests' });
  }
}

