import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Claim } from './entities/claim.entity';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClaimsWorkflowService } from './claims-workflow.service';
import { ConstatsModule } from '../constats/constats.module';
import { Constat } from '../constats/entities/constat.entity';
import { DocumentsModule } from '../documents/documents.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Claim, Constat]),
    NotificationsModule,
    ConstatsModule,
    DocumentsModule,
    forwardRef(() => OrchestratorModule),
  ],
  providers: [ClaimsService, ClaimsWorkflowService],
  controllers: [ClaimsController],
  exports: [ClaimsService, ClaimsWorkflowService],
})
export class ClaimsModule {}
