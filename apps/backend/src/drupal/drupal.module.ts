import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { DrupalController } from './drupal.controller';
import { DrupalAuthService } from './drupal-auth.service';
import { DrupalContentService } from './drupal-content.service';
import { DrupalImageService } from './drupal-image.service';

@Module({
  imports: [HttpModule, CacheModule],
  providers: [DrupalAuthService, DrupalContentService, DrupalImageService],
  exports: [DrupalContentService, DrupalImageService],
  controllers: [DrupalController],
})
export class DrupalModule {}
