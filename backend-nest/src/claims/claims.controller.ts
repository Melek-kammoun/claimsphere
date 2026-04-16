import { Controller, Get, Patch, Param } from '@nestjs/common';
import { ClaimsService } from './claims.service';

@Controller('api/claims')
export class ClaimsController {
  constructor(private claimsService: ClaimsService) {}

  @Get()
  getAllClaims() {
    return this.claimsService.getAllClaims();
  }

  @Patch(':id/approve')
  approveClaim(@Param('id') id: string) {
    return this.claimsService.approveClaim(Number(id));
  }

  @Patch(':id/reject')
  rejectClaim(@Param('id') id: string) {
    return this.claimsService.rejectClaim(Number(id));
  }
}
