import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Claim } from './entities/claim.entity';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Claim])],
  providers: [ClaimsService],
  controllers: [ClaimsController],
  exports: [ClaimsService],
})
export class ClaimsModule {}