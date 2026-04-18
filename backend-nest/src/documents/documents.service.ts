import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly bucketName = 'documents';

  constructor(
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    private readonly supabaseService: SupabaseService,
  ) {}

  async create(createDocumentDto: CreateDocumentDto) {
    try {
      const entity = this.documentsRepository.create(createDocumentDto);
      return this.documentsRepository.save(entity);
    } catch (error) {
      this.rethrowSchemaError(error);
      throw error;
    }
  }

  async createUploadedDocument(input: {
    file: Express.Multer.File;
    documentType: CreateDocumentDto['document_type'];
    claimId?: string | null;
    constatId?: string | null;
    extractedData?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    sourceTable?: string | null;
    sourceId?: string | null;
  }) {
    let upload: { path: string | null; publicUrl: string | null; uploadError?: string } = {
      path: null,
      publicUrl: null,
    };

    try {
      upload = await this.uploadFile(
        input.file,
        input.claimId ?? null,
        input.documentType,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown upload error';
      this.logger.warn(
        `Document upload fallback activated for ${input.file.originalname}: ${message}`,
      );
      upload = {
        path: null,
        publicUrl: null,
        uploadError: message,
      };
    }

    return this.create({
      claim_id: input.claimId ?? null,
      constat_id: input.constatId ?? null,
      document_type: input.documentType,
      original_name: input.file.originalname,
      mime_type: input.file.mimetype,
      file_size: input.file.size,
      storage_bucket: upload.path ? this.bucketName : null,
      storage_path: upload.path,
      public_url: upload.publicUrl,
      source_table: input.sourceTable ?? null,
      source_id: input.sourceId ?? null,
      extracted_data: input.extractedData ?? null,
      metadata: {
        ...(input.metadata ?? {}),
        ...(upload.uploadError ? { upload_error: upload.uploadError } : {}),
      },
    });
  }

  findAll() {
    return this.documentsRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string) {
    const document = await this.documentsRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return document;
  }

  async findByClaimId(claimId: string) {
    return this.documentsRepository.find({
      where: { claim_id: claimId },
      order: { created_at: 'ASC' },
    });
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto) {
    try {
      await this.documentsRepository.update(
        id,
        updateDocumentDto as Parameters<typeof this.documentsRepository.update>[1],
      );
    } catch (error) {
      this.rethrowSchemaError(error);
      throw error;
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    const document = await this.findOne(id);
    await this.documentsRepository.remove(document);
    return { success: true };
  }

  private async uploadFile(
    file: Express.Multer.File,
    claimId: string | null,
    documentType: string,
  ): Promise<{ path: string | null; publicUrl: string | null; uploadError?: string }> {
    const client = this.supabaseService.getClient();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const prefix = claimId ? `claims/${claimId}` : 'claims/unlinked';
    const path = `${prefix}/${documentType}/${Date.now()}-${safeName}`;
    await this.ensureBucketExists();

    const { error } = await client.storage
      .from(this.bucketName)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Unable to upload document ${file.originalname}: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = client.storage.from(this.bucketName).getPublicUrl(path);

    return { path, publicUrl };
  }

  private async ensureBucketExists(): Promise<void> {
    const storage = this.supabaseService.getClient().storage as any;

    if (typeof storage.listBuckets !== 'function') {
      return;
    }

    const { data, error } = await storage.listBuckets();
    if (error) {
      throw new Error(`Unable to list storage buckets: ${error.message}`);
    }

    const bucketExists = Array.isArray(data)
      ? data.some((bucket: { name?: string; id?: string }) =>
          bucket.name === this.bucketName || bucket.id === this.bucketName,
        )
      : false;

    if (bucketExists) {
      return;
    }

    const createResult = await storage.createBucket(this.bucketName, {
      public: true,
      fileSizeLimit: '20MB',
    });

    if (createResult.error) {
      throw new Error(
        `Unable to create storage bucket ${this.bucketName}: ${createResult.error.message}`,
      );
    }
  }

  private rethrowSchemaError(error: unknown): never | void {
    if (!(error instanceof QueryFailedError)) {
      return;
    }

    const driverError = (error as QueryFailedError & {
      driverError?: { code?: string; message?: string };
    }).driverError;

    if (driverError?.code === '42703') {
      throw new Error(
        'Schema documents incompatible avec le code actuel. La table "documents" dans la base ne contient pas encore les nouvelles colonnes comme "mime_type". Il faut appliquer la migration de la table documents ou ajouter les colonnes manquantes.',
      );
    }
  }
}
