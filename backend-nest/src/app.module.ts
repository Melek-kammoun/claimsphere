import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { ProfilesModule } from './profiles/profiles.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DocumentsModule } from './documents/documents.module';
import { ContractsModule } from './contracts/contracts.module';
import { ClaimsModule } from './claims/claims.module';
import { AiScoresModule } from './ai-scores/ai-scores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    ProfilesModule,
    NotificationsModule,
    DocumentsModule,
    ContractsModule,
    ClaimsModule,
    AiScoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}