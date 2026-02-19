import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DrupalController } from './drupal.controller';
import { DrupalAuthService } from './drupal-auth.service';
import { DrupalContentService } from './drupal-content.service';

@Module({
  imports: [HttpModule],
  providers: [DrupalAuthService, DrupalContentService],
  exports: [DrupalContentService],
  controllers: [DrupalController],
})
export class DrupalModule {}
