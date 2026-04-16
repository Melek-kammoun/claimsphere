import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Constat } from './constats/entities/constat.entity';
import { ConstatParty } from './constats/entities/constat-party.entity';
import { SupabaseModule } from './supabase/supabase.module';
import { ClaimsModule } from './claims/claims.module';
import { EstimateModule } from './estimate/estimate.module';
import { ContratsModule } from './contrats/contrats.module';
import { DamageAnalysisModule } from './damage-analysis/damage-analysis.module';
import { DamageAgentModule } from './damage-agent/damage-agent.module';
import { UsersModule } from './users/users.module';
import { AgentsModule } from './agents/agents.module';
import { AiScoresModule } from './ai_scores/ai_scores.module';
import { ContractsModule } from './contracts/contracts.module';
import { ConstatsModule } from './constats/constats.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['backend-nest/.env', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [User, Constat, ConstatParty],
        synchronize: false,
        ssl: { rejectUnauthorized: false },
      }),
    }),
    SupabaseModule,
    ClaimsModule,
    EstimateModule,
    ContratsModule,
    DamageAnalysisModule,
    DamageAgentModule,
    UsersModule,
    AgentsModule,
    AiScoresModule,
    ContractsModule,
    ConstatsModule,
    DocumentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}