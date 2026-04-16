import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { AiScoresModule } from './ai_scores/ai_scores.module';
import { ContractsModule } from './contracts/contracts.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { OcrModule } from './ocr/ocr.module';
import { Claim } from './ocr/entities/claim.entity';
import { PvPolice } from './ocr/entities/pv-police.entity';
import { RapportExpert } from './ocr/entities/rapport-expert.entity';
import { Devis } from './ocr/entities/devis.entity';
=======
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { ClaimsModule } from './claims/claims.module';
import { EstimateModule } from './estimate/estimate.module';
import { ContratsModule } from './contrats/contrats.module';
>>>>>>> 0a3bc8fb7f4661c42eb048734db850d0386544ec

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
<<<<<<< HEAD
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, AuthModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [User, PvPolice, RapportExpert, Devis],
        synchronize: false,
        ssl: { rejectUnauthorized: false },
      }),
    }),
    UsersModule,
    AiScoresModule,
    ContractsModule,
    DocumentsModule,
    NotificationsModule,
    OcrModule,
=======
    SupabaseModule,
    ClaimsModule,
    EstimateModule,
    ContratsModule,
>>>>>>> 0a3bc8fb7f4661c42eb048734db850d0386544ec
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
