import { Module } from '@nestjs/common';
import { DrupalModule } from 'src/drupal/drupal.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  providers: [MembersService],
  controllers: [MembersController],
  imports: [DrupalModule],
})
export class MembersModule {}
