import { RateLimiterMongo } from 'rate-limiter-flexible';
import { getMongoClient } from './db';

const rateLimiter = new RateLimiterMongo({
  storeClient: getMongoClient(),
  dbName: process.env.MONGODB_DB,
  tableName: 'rateLimits',
  points: 10, // Number of points
  duration: 1, // Per second
});

export async function rateLimit(identifier: string) {
  try {
    await rateLimiter.consume(identifier);
    return true;
  } catch (error) {
    return false;
  }
}

export async function getRateLimitInfo(identifier: string) {
  try {
    const res = await rateLimiter.get(identifier);
    return {
      remaining: res?.remainingPoints || 0,
      reset: res?.msBeforeNext || 0,
    };
  } catch (error) {
    return {
      remaining: 0,
      reset: 0,
    };
  }
} 