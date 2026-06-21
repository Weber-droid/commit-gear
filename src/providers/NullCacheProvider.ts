import type { CacheProvider } from '../types/index.js';

export class NullCacheProvider implements CacheProvider {
  async get<T>(): Promise<T | null> {
    return null;
  }

  async set(): Promise<void> {}

  async del(): Promise<void> {}

  async delByPattern(): Promise<void> {}

  async exists(): Promise<boolean> {
    return false;
  }
}
