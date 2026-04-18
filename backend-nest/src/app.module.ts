import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClaimsModule } from './claims/claims.module';
import { ContratsModule } from './contrats/contrats.module';
import { ConstatsModule } from './constats/constats.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OcrModule } from './ocr/ocr.module';
import { EstimateModule } from './estimate/estimate.module';
import { DamageAnalysisModule } from './damage-analysis/damage-analysis.module';
import { DamageAgentModule } from './damage-agent/damage-agent.module';
import { AgentsModule } from './agents/agents.module';
import { AiScoresModule } from './ai-scores/ai-scores.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER') ?? config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        ssl: { rejectUnauthorized: false },
      }),
    }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    ClaimsModule,
    ContratsModule,
    ConstatsModule,
    DocumentsModule,
    NotificationsModule,
    OcrModule,
    EstimateModule,
    DamageAnalysisModule,
    DamageAgentModule,
    AgentsModule,
    AiScoresModule,
    OrchestratorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
