import { Redis } from 'ioredis';
import type { CacheProvider } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class RedisCacheProvider implements CacheProvider {
  private readonly redis: Redis;
  private bypassUntil = 0;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
    });

    this.redis.on('error', (err: Error) => {
      logger.warn('Redis error', { message: err.message });
      this.bypassUntil = Date.now() + 60_000;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.redis.connect();
      logger.info('Redis connected');
    } catch (err) {
      logger.warn('Redis unavailable, using pass-through mode');
    }
  }

  private isBypassed(): boolean {
    return Date.now() < this.bypassUntil || this.redis.status !== 'ready';
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isBypassed()) return null;
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (this.isBypassed()) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch {
      // graceful degradation
    }
  }

  async del(key: string | string[]): Promise<void> {
    if (this.isBypassed()) return;
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length) await this.redis.del(...keys);
    } catch {
      // graceful degradation
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (this.isBypassed()) return;
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );
        cursor = nextCursor;
        if (keys.length) await this.redis.del(...keys);
      } while (cursor !== '0');
    } catch {
      // graceful degradation
    }
  }

  async exists(key: string): Promise<boolean> {
    if (this.isBypassed()) return false;
    try {
      return (await this.redis.exists(key)) === 1;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
