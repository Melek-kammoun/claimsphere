import { Controller, Get, Post, Param, Patch, Body, UseGuards, Req, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClaimsService } from './claims.service';

@Controller('api/claims')
export class ClaimsController {
  private readonly logger = new Logger('ClaimsController');

  constructor(private claimsService: ClaimsService) {}

  /**
   * Create a new claim
   * POST /api/claims
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createClaim(@Body() body: any, @Req() req: any) {
    this.logger.log('🔍 POST /api/claims called');
    this.logger.log('📋 Authenticated user:', req.user);
    
    if (!req.user || !req.user.id) {
      this.logger.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }

    try {
      const newClaim = await this.claimsService.create({
        user_id: req.user.id,
        contract_id: body.contract_id,
        type: body.type,
        date: body.date,
        location: body.location,
        description: body.description,
        documents: body.documents,
      });
      
      this.logger.log(`✅ Claim created: ${newClaim.id}`);
      
      return {
        success: true,
        data: newClaim,
      };
    } catch (error) {
      this.logger.error('❌ Error creating claim:', error);
      throw error;
    }
  }

  /**
   * Get all claims for authenticated user
   * GET /api/claims
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserClaims(@Req() req: any) {
    this.logger.log('🔍 GET /api/claims called');
    this.logger.log('📋 Authenticated user:', req.user);
    
    if (!req.user || !req.user.id) {
      this.logger.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }

    try {
      const claims = await this.claimsService.findByUserId(req.user.id);
      this.logger.log(`✅ Retrieved ${claims.length} claims for user ${req.user.id}`);
      
      return {
        success: true,
        data: claims,
        total: claims.length,
      };
    } catch (error) {
      this.logger.error('❌ Error fetching claims:', error);
      throw error;
    }
  }

  /**
   * Get claim by ID
   * GET /api/claims/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getClaimById(@Param('id') id: string, @Req() req: any) {
    this.logger.log(`🔍 GET /api/claims/${id}`);
    
    const claim = await this.claimsService.findOne(id);
    
    if (!claim) {
      this.logger.error(`❌ Claim not found: ${id}`);
      throw new Error('Claim not found');
    }
    
    if (claim.user_id !== req.user.id) {
      this.logger.error(`❌ Access denied: User ${req.user.id} cannot access claim ${id}`);
      throw new Error('Access denied');
    }
    
    this.logger.log(`✅ Claim retrieved: ${id}`);
    return {
      success: true,
      data: claim,
    };
  }

  /**
   * Approve claim
   * PATCH /api/claims/:id/approve
   */
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  async approveClaim(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    this.logger.log(`🔍 PATCH /api/claims/${id}/approve`);
    
    const claim = await this.claimsService.findOne(id);
    if (!claim) {
      throw new Error('Claim not found');
    }
    if (claim.user_id !== req.user.id) {
      throw new Error('Access denied');
    }

    const updatedClaim = await this.claimsService.updateStatus(id, 'resolved');
    this.logger.log(`✅ Claim approved: ${id}`);
    
    return {
      success: true,
      data: updatedClaim,
    };
  }

  /**
   * Reject claim
   * PATCH /api/claims/:id/reject
   */
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectClaim(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    this.logger.log(`🔍 PATCH /api/claims/${id}/reject`);
    
    const claim = await this.claimsService.findOne(id);
    if (!claim) {
      throw new Error('Claim not found');
    }
    if (claim.user_id !== req.user.id) {
      throw new Error('Access denied');
    }

    const updatedClaim = await this.claimsService.updateStatus(id, 'rejected');
    this.logger.log(`✅ Claim rejected: ${id}`);
    
    return {
      success: true,
      data: updatedClaim,
    };
  }
}