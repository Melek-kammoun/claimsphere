import { Module } from '@nestjs/common';
import { ContratsController } from './contrats.controller';
import { ContratsService } from './contrats.service';

@Module({
  controllers: [ContratsController],
  providers: [ContratsService],
  exports: [ContratsService],
})
export class ContratsModule {}
