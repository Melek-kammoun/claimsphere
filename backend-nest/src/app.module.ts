import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { ProfilesModule } from './profiles/profiles.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DocumentsModule } from './documents/documents.module';
import { ContractsModule } from './contracts/contracts.module';
import { ClaimsModule } from './claims/claims.module';
import { AiScoresModule } from './ai_scores/ai_scores.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
/*<<<<<<< HEAD
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
*/
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
        entities: [User],
        synchronize: false,
        ssl: { rejectUnauthorized: false },
      }),
    }),
    UsersModule,
    AiScoresModule,
    ContractsModule,
    DocumentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}