import { Inject, Injectable } from '@nestjs/common';
import { Keyv } from 'keyv';
import { CACHE_INSTANCE } from './cache.constants';

@Injectable()
export class CacheService {
  private readonly prefix = 'about-us-editor:';

  constructor(@Inject(CACHE_INSTANCE) private readonly cache: Keyv) {}

  async get<T>(key: string): Promise<T | null> {
    const result = await this.cache.get(this.prefix + key);
    return (result as T) ?? null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cache.set(this.prefix + key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.cache.delete(this.prefix + key);
  }
}
