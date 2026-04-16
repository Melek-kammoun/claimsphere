import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import OpenAI from 'openai';
import { PvPolice } from '../entities/pv-police.entity';
import { RapportExpert } from '../entities/rapport-expert.entity';
import { Devis } from '../entities/devis.entity';

@Injectable()
export class OcrService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(PvPolice)
    private pvPoliceRepository: Repository<PvPolice>,
    @InjectRepository(RapportExpert)
    private rapportExpertRepository: Repository<RapportExpert>,
    @InjectRepository(Devis)
    private devisRepository: Repository<Devis>,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Extract text from PDF (both scanned and digital)
   */
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      const pdfParseLib = require('pdf-parse/lib/pdf-parse.js');
      const data = await pdfParseLib(pdfBuffer);

      if (data.text && data.text.trim().length > 0) {
        return data.text;
      }

      console.log('No direct text found. Running OCR on scanned document...');
      return '';
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw error;
    }
  }

  /**
   * Run OCR on an image buffer using Tesseract
   */
  async runOCR(imageBuffer: Buffer): Promise<string> {
    try {
      const result = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: (m: any) => console.log('OCR Progress:', m.progress),
      });

      return result.data.text;
    } catch (error) {
      console.error('OCR Error:', error);
      throw error;
    }
  }

  /**
   * Parse PV Police with OpenAI
   */
  async parsePvPolice(text: string): Promise<any> {
    try {
      const systemPrompt = `You are an expert at extracting data from police accident reports (PV Police). Extract the following information in JSON format:
      {
        "pv_number": "string (e.g., PV-2025-00472)",
        "accident_date": "string (YYYY-MM-DD)",
        "accident_time": "string (HH:mm)",
        "accident_location": "string",
        "driver_a_name": "string or null",
        "driver_a_cin": "string or null",
        "driver_a_permit": "string or null",
        "driver_b_name": "string or null",
        "driver_b_cin": "string or null",
        "driver_b_permit": "string or null",
        "vehicle_a_registration": "string or null",
        "vehicle_b_registration": "string or null",
        "circumstances": "string (brief description)",
        "responsibility": "string ('A', 'B', or 'Shared')",
        "injured_persons": "string or null",
        "witnesses": "string or null",
        "officer_name": "string or null",
        "police_station": "string or null",
        "confidence": "number (0-1)"
      }
      If a field cannot be found, set it to null. Always return valid JSON.`;

      const userPrompt = `Extract data from this police accident report:\n\n${text}`;

      console.log('🤖 Sending PV Police to OpenAI for parsing...');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;

      if (!content) {
        console.error('❌ No response from OpenAI');
        return {
          error: 'No response from OpenAI',
          confidence: 0,
        };
      }

      try {
        const parsed = JSON.parse(content);
        console.log('✅ PV Police parsed successfully');
        return parsed;
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('Raw response:', content);
        return {
          raw_text: text,
          error: 'Could not parse PV Police data',
          confidence: 0,
        };
      }
    } catch (error) {
      console.error('❌ Error parsing PV Police:', error);
      throw error;
    }
  }

  /**
   * Parse Rapport Expert with OpenAI
   */
  async parseRapportExpert(text: string): Promise<any> {
    try {
      const systemPrompt = `You are an expert at extracting data from expert vehicle inspection reports (Rapport d'Expert). Extract the following information in JSON format:
      {
        "reference": "string (e.g., RAP-EXP-2025-0089)",
        "expert_name": "string or null",
        "expert_agrément": "string or null",
        "expertise_date": "string (YYYY-MM-DD)",
        "vehicle_make": "string or null",
        "vehicle_model": "string or null",
        "vehicle_registration": "string or null",
        "vehicle_vin": "string or null",
        "vehicle_mileage": "number or null",
        "vehicle_year": "number or null",
        "vehicle_value_new": "number or null (in TND)",
        "vehicle_value_market": "number or null (in TND)",
        "damages_description": "string (detailed damages)",
        "parts_to_replace": "string (list of parts)",
        "parts_to_repair": "string (list of parts)",
        "repair_value_estimate": "number or null (in TND)",
        "conclusion": "string ('Repairable' or 'Total Loss')",
        "confidence": "number (0-1)"
      }
      If a field cannot be found, set it to null. Always return valid JSON.`;

      const userPrompt = `Extract data from this expert inspection report:\n\n${text}`;

      console.log('🤖 Sending Rapport Expert to OpenAI for parsing...');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;

      if (!content) {
        console.error('❌ No response from OpenAI');
        return {
          error: 'No response from OpenAI',
          confidence: 0,
        };
      }

      try {
        const parsed = JSON.parse(content);
        console.log('✅ Rapport Expert parsed successfully');
        return parsed;
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('Raw response:', content);
        return {
          raw_text: text,
          error: 'Could not parse Rapport Expert data',
          confidence: 0,
        };
      }
    } catch (error) {
      console.error('❌ Error parsing Rapport Expert:', error);
      throw error;
    }
  }

  /**
   * Parse Devis with OpenAI
   */
  async parseDevis(text: string): Promise<any> {
    try {
      const systemPrompt = `You are an expert at extracting data from repair quotes (Devis). Extract the following information in JSON format:
      {
        "reference": "string (e.g., DEV-2025-0341)",
        "devis_date": "string (YYYY-MM-DD)",
        "garage_name": "string or null",
        "garage_address": "string or null",
        "garage_fiscal_id": "string or null",
        "vehicle_make": "string or null",
        "vehicle_model": "string or null",
        "vehicle_registration": "string or null",
        "owner_name": "string or null",
        "items_list": "string (detailed list of items and parts)",
        "labor_hours": "number or null",
        "labor_rate_per_hour": "number or null (in TND)",
        "subtotal_ht": "number or null (in TND)",
        "tva_19": "number or null (in TND)",
        "total_ttc": "number or null (in TND)",
        "validity_days": "number or null",
        "confidence": "number (0-1)"
      }
      If a field cannot be found, set it to null. Always return valid JSON.`;

      const userPrompt = `Extract data from this repair quote:\n\n${text}`;

      console.log('🤖 Sending Devis to OpenAI for parsing...');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;

      if (!content) {
        console.error('❌ No response from OpenAI');
        return {
          error: 'No response from OpenAI',
          confidence: 0,
        };
      }

      try {
        const parsed = JSON.parse(content);
        console.log('✅ Devis parsed successfully');
        return parsed;
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('Raw response:', content);
        return {
          raw_text: text,
          error: 'Could not parse Devis data',
          confidence: 0,
        };
      }
    } catch (error) {
      console.error('❌ Error parsing Devis:', error);
      throw error;
    }
  }

  /**
   * Upload and process PV Police
   */
  async uploadPvPolice(file: Express.Multer.File): Promise<any> {
    try {
      if (!file) {
        throw new Error('No file uploaded');
      }

      console.log(`🔍 Processing PV Police: ${file.originalname}`);
      console.log(`📄 File size: ${file.size} bytes`);

      // Extract text
      let extractedText = await this.extractTextFromPDF(file.buffer);
      console.log(`📝 Extracted text length: ${extractedText.length}`);

      if (!extractedText || extractedText.trim().length === 0) {
        console.log('⚠️ No text found. Running OCR on scanned PV Police...');
        extractedText = await this.runOCR(file.buffer);
        console.log(`🔤 OCR text length: ${extractedText.length}`);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Could not extract text from PDF');
      }

      // Parse with OpenAI
      const pvData = await this.parsePvPolice(extractedText);
      console.log('✅ PV Police data extracted:', pvData);

      // Save to database
      const pvPolice = this.pvPoliceRepository.create({
        pv_number: pvData.pv_number || `PV-${Date.now()}`,
        accident_date: pvData.accident_date ? new Date(pvData.accident_date) : new Date(),
        accident_time: pvData.accident_time || null,
        accident_location: pvData.accident_location || null,
        driver_a_name: pvData.driver_a_name || null,
        driver_a_cin: pvData.driver_a_cin || null,
        driver_a_permit: pvData.driver_a_permit || null,
        driver_b_name: pvData.driver_b_name || null,
        driver_b_cin: pvData.driver_b_cin || null,
        driver_b_permit: pvData.driver_b_permit || null,
        vehicle_a_registration: pvData.vehicle_a_registration || null,
        vehicle_b_registration: pvData.vehicle_b_registration || null,
        circumstances: pvData.circumstances || null,
        responsibility: pvData.responsibility || null,
        injured_persons: pvData.injured_persons || null,
        witnesses: pvData.witnesses || null,
        officer_name: pvData.officer_name || null,
        police_station: pvData.police_station || null,
        file_name: file.originalname,
        extracted_text: extractedText.substring(0, 10000),
        parsed_data: pvData,
      });

      const savedPvPolice = await this.pvPoliceRepository.save(pvPolice);
      console.log('💾 PV Police saved to database:', savedPvPolice.id);

      return {
        success: true,
        message: 'PV Police processed successfully',
        document: savedPvPolice,
        extractedData: pvData,
      };
    } catch (error) {
      console.error('❌ PV Police processing error:', error);
      throw error;
    }
  }

  /**
   * Upload and process Rapport Expert
   */
  async uploadRapportExpert(file: Express.Multer.File): Promise<any> {
    try {
      if (!file) {
        throw new Error('No file uploaded');
      }

      console.log(`🔍 Processing Rapport Expert: ${file.originalname}`);
      console.log(`📄 File size: ${file.size} bytes`);

      // Extract text
      let extractedText = await this.extractTextFromPDF(file.buffer);
      console.log(`📝 Extracted text length: ${extractedText.length}`);

      if (!extractedText || extractedText.trim().length === 0) {
        console.log('⚠️ No text found. Running OCR on scanned Rapport Expert...');
        extractedText = await this.runOCR(file.buffer);
        console.log(`🔤 OCR text length: ${extractedText.length}`);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Could not extract text from PDF');
      }

      // Parse with OpenAI
      const expertData = await this.parseRapportExpert(extractedText);
      console.log('✅ Rapport Expert data extracted:', expertData);

      // Save to database
      const rapportExpert = this.rapportExpertRepository.create({
        reference: expertData.reference || `RAP-${Date.now()}`,
        expert_name: expertData.expert_name || null,
        expert_agrément: expertData.expert_agrément || null,
        expertise_date: expertData.expertise_date ? new Date(expertData.expertise_date) : new Date(),
        vehicle_make: expertData.vehicle_make || null,
        vehicle_model: expertData.vehicle_model || null,
        vehicle_registration: expertData.vehicle_registration || null,
        vehicle_vin: expertData.vehicle_vin || null,
        vehicle_mileage: expertData.vehicle_mileage || null,
        vehicle_year: expertData.vehicle_year || null,
        vehicle_value_new: expertData.vehicle_value_new || null,
        vehicle_value_market: expertData.vehicle_value_market || null,
        damages_description: expertData.damages_description || null,
        parts_to_replace: expertData.parts_to_replace || null,
        parts_to_repair: expertData.parts_to_repair || null,
        repair_value_estimate: expertData.repair_value_estimate || null,
        conclusion: expertData.conclusion || null,
        file_name: file.originalname,
        extracted_text: extractedText.substring(0, 10000),
        parsed_data: expertData,
      });

      const savedRapportExpert = await this.rapportExpertRepository.save(rapportExpert);
      console.log('💾 Rapport Expert saved to database:', savedRapportExpert.id);

      return {
        success: true,
        message: 'Rapport Expert processed successfully',
        document: savedRapportExpert,
        extractedData: expertData,
      };
    } catch (error) {
      console.error('❌ Rapport Expert processing error:', error);
      throw error;
    }
  }

  /**
   * Upload and process Devis
   */
  async uploadDevis(file: Express.Multer.File): Promise<any> {
    try {
      if (!file) {
        throw new Error('No file uploaded');
      }

      console.log(`🔍 Processing Devis: ${file.originalname}`);
      console.log(`📄 File size: ${file.size} bytes`);

      // Extract text
      let extractedText = await this.extractTextFromPDF(file.buffer);
      console.log(`📝 Extracted text length: ${extractedText.length}`);

      if (!extractedText || extractedText.trim().length === 0) {
        console.log('⚠️ No text found. Running OCR on scanned Devis...');
        extractedText = await this.runOCR(file.buffer);
        console.log(`🔤 OCR text length: ${extractedText.length}`);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Could not extract text from PDF');
      }

      // Parse with OpenAI
      const devisData = await this.parseDevis(extractedText);
      console.log('✅ Devis data extracted:', devisData);

      // Save to database
      const devis = this.devisRepository.create({
        reference: devisData.reference || `DEV-${Date.now()}`,
        devis_date: devisData.devis_date ? new Date(devisData.devis_date) : new Date(),
        garage_name: devisData.garage_name || null,
        garage_address: devisData.garage_address || null,
        garage_fiscal_id: devisData.garage_fiscal_id || null,
        vehicle_make: devisData.vehicle_make || null,
        vehicle_model: devisData.vehicle_model || null,
        vehicle_registration: devisData.vehicle_registration || null,
        owner_name: devisData.owner_name || null,
        items_list: devisData.items_list || null,
        labor_hours: devisData.labor_hours || null,
        labor_rate_per_hour: devisData.labor_rate_per_hour || null,
        subtotal_ht: devisData.subtotal_ht || null,
        tva_19: devisData.tva_19 || null,
        total_ttc: devisData.total_ttc || null,
        validity_days: devisData.validity_days || null,
        file_name: file.originalname,
        extracted_text: extractedText.substring(0, 10000),
        parsed_data: devisData,
      });

      const savedDevis = await this.devisRepository.save(devis);
      console.log('💾 Devis saved to database:', savedDevis.id);

      return {
        success: true,
        message: 'Devis processed successfully',
        document: savedDevis,
        extractedData: devisData,
      };
    } catch (error) {
      console.error('❌ Devis processing error:', error);
      throw error;
    }
  }

  /**
   * Get PV Police by ID
   */
  async getPvPoliceById(id: string): Promise<PvPolice | null> {
    return this.pvPoliceRepository.findOne({ where: { id } });
  }

  /**
   * Get all PV Police
   */
  async getAllPvPolice(): Promise<PvPolice[]> {
    return this.pvPoliceRepository.find({ order: { created_at: 'DESC' } });
  }

  /**
   * Get Rapport Expert by ID
   */
  async getRapportExpertById(id: string): Promise<RapportExpert | null> {
    return this.rapportExpertRepository.findOne({ where: { id } });
  }

  /**
   * Get all Rapport Expert
   */
  async getAllRapportExpert(): Promise<RapportExpert[]> {
    return this.rapportExpertRepository.find({ order: { created_at: 'DESC' } });
  }

  /**
   * Get Devis by ID
   */
  async getDevisById(id: string): Promise<Devis | null> {
    return this.devisRepository.findOne({ where: { id } });
  }

  /**
   * Get all Devis
   */
  async getAllDevis(): Promise<Devis[]> {
    return this.devisRepository.find({ order: { created_at: 'DESC' } });
  }
}