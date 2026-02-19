import KeyvRedis from '@keyv/redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Keyv } from 'keyv';
import { CACHE_INSTANCE } from './cache.constants';
import { CacheService } from './cache.service';

@Module({
  imports: [ConfigModule],
  providers: [
    CacheService,
    {
      provide: CACHE_INSTANCE,
      useFactory: (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const keyvRedis = new KeyvRedis(redisUrl);
        return new Keyv({ store: keyvRedis });
      },
      inject: [ConfigService],
    },
  ],
  exports: [CacheService],
})
export class CacheModule {}
