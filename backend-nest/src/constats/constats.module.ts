import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Constat } from './entities/constat.entity';
import { ConstatParty } from './entities/constat-party.entity';
import { ConstatsController } from './constats.controller';
import { ConstatsService } from './services/constats.service';
import { QrCodeService } from './services/qrcode.service';
import { PdfService } from './services/pdf.service';
import { EmailService } from './services/email.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [TypeOrmModule.forFeature([Constat, ConstatParty]), SupabaseModule],
  controllers: [ConstatsController],
  providers: [ConstatsService, QrCodeService, PdfService, EmailService],
  exports: [ConstatsService],
})
export class ConstatsModule {}
