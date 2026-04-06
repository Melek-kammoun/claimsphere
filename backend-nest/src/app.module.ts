import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { ClaimsModule } from './claims/claims.module';
import { EstimateModule } from './estimate/estimate.module';
import { ContratsModule } from './contrats/contrats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    ClaimsModule,
    EstimateModule,
    ContratsModule,
  ],
})
export class AppModule {}
