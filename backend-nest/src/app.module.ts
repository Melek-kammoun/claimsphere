import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContractsModule } from './contracts/contracts.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OcrModule } from './ocr/ocr.module';
import { ClaimsModule } from './claims/claims.module'; // ← MUST BE HERE
import { EstimateModule } from './estimate/estimate.module';
import { ContratsModule } from './contrats/contrats.module';
import { AiScoresModule } from './ai-scores/ai-scores.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'claimsphere',
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // ← This should pick up Claim entity
      synchronize: false,
      logging: false,
      dropSchema: false,
      ssl: { rejectUnauthorized: false },
    }),
    AuthModule,
    UsersModule,
    ContractsModule,
    DocumentsModule,
    NotificationsModule,
    OcrModule,
    ClaimsModule, // ← MUST BE HERE
    EstimateModule,
    ContratsModule,
    AiScoresModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
