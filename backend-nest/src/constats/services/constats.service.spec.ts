import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConstatsService } from './constats.service';
import { Constat, ConstatStatus } from '../entities/constat.entity';
import { SupabaseService } from '../../supabase/supabase.service';
import { PdfService } from './pdf.service';
import { EmailService } from './email.service';
import { QrCodeService } from './qrcode.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ConstatsService', () => {
  let service: ConstatsService;
  let mockConstatRepository: any;
  let mockSupabaseService: any;
  let mockPdfService: any;
  let mockEmailService: any;
  let mockQrCodeService: any;

  const testUser = {
    id: '00000000-0000-0000-0000-000000000001',
  };

  const testConstat = {
    id: '00000000-0000-0000-0000-000000000002',
    user_a_id: testUser.id,
    qr_token: '00000000-0000-0000-0000-000000000003',
    qr_expires_at: new Date(Date.now() + 30 * 60 * 1000),
    status: ConstatStatus.PENDING,
    user_a_data: {
      full_name: 'Jean Dupont',
      phone: '+33612345678',
      email: 'jean@example.com',
    },
    vehicle_a_data: {
      plate: 'AB-123-CD',
      brand: 'Peugeot',
      model: '308',
    },
    insurance_a_data: {
      company: 'AXA',
      policy_number: 'POL-123456',
    },
    accident_details: {
      date: '2026-04-15',
      time: '14:30',
      location: 'Intersection Rue de la Paix',
      description: 'Collision frontale',
    },
    created_at: new Date(),
    updated_at: new Date(),
    action_logs: [],
  };

  beforeEach(async () => {
    mockConstatRepository = {
      create: jest.fn().mockReturnValue(testConstat),
      save: jest.fn().mockResolvedValue(testConstat),
      findOne: jest.fn().mockResolvedValue(testConstat),
      find: jest.fn().mockResolvedValue([testConstat]),
    };

    mockSupabaseService = {
      getClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: '123' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
        storage: {
          from: jest.fn(),
        },
      }),
    };

    mockPdfService = {
      generateConstatPdf: jest.fn().mockResolvedValue(Buffer.from('PDF')),
    };

    mockEmailService = {
      sendConstatEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockQrCodeService = {
      generateQrCode: jest.fn().mockResolvedValue('qr-data-url'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConstatsService,
        {
          provide: getRepositoryToken(Constat),
          useValue: mockConstatRepository,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: PdfService,
          useValue: mockPdfService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: QrCodeService,
          useValue: mockQrCodeService,
        },
      ],
    }).compile();

    service = module.get<ConstatsService>(ConstatsService);
  });

  describe('createConstat', () => {
    it('should create a constat successfully', async () => {
      const createDto = {
        user_a_data: testConstat.user_a_data,
        vehicle_a_data: testConstat.vehicle_a_data,
        insurance_a_data: testConstat.insurance_a_data,
        accident_details: testConstat.accident_details,
        signature_a: 'base64-signature',
      };

      const result = await service.createConstat(testUser.id, createDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(ConstatStatus.PENDING);
      expect(mockConstatRepository.create).toHaveBeenCalled();
      expect(mockConstatRepository.save).toHaveBeenCalled();
    });

    it('should fail if user has no active contract', async () => {
      mockSupabaseService.getClient().from().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No contract' },
      });

      const createDto = {
        user_a_data: testConstat.user_a_data,
        vehicle_a_data: testConstat.vehicle_a_data,
        insurance_a_data: testConstat.insurance_a_data,
        accident_details: testConstat.accident_details,
        signature_a: 'base64-signature',
      };

      await expect(
        service.createConstat(testUser.id, createDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getConstatByQrToken', () => {
    it('should retrieve constat by QR token', async () => {
      const result = await service.getConstatByQrToken(testConstat.qr_token);

      expect(result).toBeDefined();
      expect(mockConstatRepository.findOne).toHaveBeenCalledWith({
        where: { qr_token: testConstat.qr_token },
      });
    });

    it('should fail if QR code is expired', async () => {
      const expiredConstat = {
        ...testConstat,
        qr_expires_at: new Date(Date.now() - 1000), // Expired
      };

      mockConstatRepository.findOne.mockResolvedValueOnce(expiredConstat);

      await expect(
        service.getConstatByQrToken(testConstat.qr_token)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should fail if constat is not pending', async () => {
      const completedConstat = {
        ...testConstat,
        status: ConstatStatus.COMPLETE,
      };

      mockConstatRepository.findOne.mockResolvedValueOnce(completedConstat);

      await expect(
        service.getConstatByQrToken(testConstat.qr_token)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('completeConstat', () => {
    it('should complete constat with user B data', async () => {
      const userB = {
        id: '00000000-0000-0000-0000-000000000004',
      };

      const completeDto = {
        user_b_data: {
          full_name: 'Marie Martin',
          phone: '+33687654321',
          email: 'marie@example.com',
        },
        vehicle_b_data: {
          plate: 'XY-456-ZA',
          brand: 'Renault',
          model: 'Clio',
        },
        insurance_b_data: {
          company: 'Allianz',
          policy_number: 'POL-654321',
        },
        signature_b: 'base64-signature',
      };

      const result = await service.completeConstat(
        testConstat.qr_token,
        userB.id,
        completeDto
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(ConstatStatus.COMPLETE);
    });

    it('should fail if user tries to complete their own constat', async () => {
      const completeDto = {
        user_b_data: { full_name: 'Test' },
        vehicle_b_data: { plate: 'AB-123' },
        insurance_b_data: { company: 'AXA' },
        signature_b: 'signature',
      };

      await expect(
        service.completeConstat(
          testConstat.qr_token,
          testUser.id, // Same user as A
          completeDto
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail if constat already completed', async () => {
      const completedConstat = {
        ...testConstat,
        status: ConstatStatus.COMPLETE,
        user_b_id: '00000000-0000-0000-0000-000000000005',
      };

      mockConstatRepository.findOne.mockResolvedValueOnce(completedConstat);

      const completeDto = {
        user_b_data: { full_name: 'Test' },
        vehicle_b_data: { plate: 'AB-123' },
        insurance_b_data: { company: 'AXA' },
        signature_b: 'signature',
      };

      await expect(
        service.completeConstat(
          testConstat.qr_token,
          '00000000-0000-0000-0000-000000000006',
          completeDto
        )
      ).rejects.toThrow();
    });
  });

  describe('listUserConstats', () => {
    it('should list all constats for a user', async () => {
      const result = await service.listUserConstats(testUser.id);

      expect(Array.isArray(result)).toBe(true);
      expect(mockConstatRepository.find).toHaveBeenCalled();
    });
  });
});
