import { Test, TestingModule } from '@nestjs/testing';
import { ConstatsController } from './constats.controller';
import { ConstatsService } from './services/constats.service';
import { QrCodeService } from './services/qrcode.service';

describe('ConstatsController', () => {
  let controller: ConstatsController;
  let mockConstatsService: any;
  let mockQrCodeService: any;

  beforeEach(async () => {
    mockConstatsService = {
      createConstat: jest.fn(),
      getConstatByQrToken: jest.fn(),
      completeConstat: jest.fn(),
      getConstatById: jest.fn(),
      listUserConstats: jest.fn(),
      resendQrCode: jest.fn(),
    };

    mockQrCodeService = {
      validateQrToken: jest.fn().mockReturnValue(true),
      generateQrCode: jest.fn().mockResolvedValue('qr-data-url'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConstatsController],
      providers: [
        {
          provide: ConstatsService,
          useValue: mockConstatsService,
        },
        {
          provide: QrCodeService,
          useValue: mockQrCodeService,
        },
      ],
    }).compile();

    controller = module.get<ConstatsController>(ConstatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createConstat', () => {
    it('should create a constat', async () => {
      const mockRequest = {
        user: { id: 'user-123' },
        headers: { 'user-agent': 'Mozilla/5.0' },
        ip: '127.0.0.1',
      };

      const mockConstat = {
        id: 'constat-123',
        qr_token: 'token-123',
        status: 'en_attente',
      };

      mockConstatsService.createConstat.mockResolvedValue(mockConstat);
      mockQrCodeService.generateQrCode.mockResolvedValue('qr-code-data');

      const result = await controller.createConstat(mockRequest as any, {} as any);

      expect(result).toHaveProperty('constat');
      expect(result).toHaveProperty('qr_code');
      expect(mockConstatsService.createConstat).toHaveBeenCalled();
    });
  });

  describe('scanQrCode', () => {
    it('should scan a valid QR code', async () => {
      const token = '00000000-0000-0000-0000-000000000001';
      const mockConstat = { id: 'constat-123' };

      mockQrCodeService.validateQrToken.mockReturnValue(true);
      mockConstatsService.getConstatByQrToken.mockResolvedValue(mockConstat);
      mockQrCodeService.generateQrCode.mockResolvedValue('qr-data');

      const result = await controller.scanQrCode(token);

      expect(result).toHaveProperty('constat');
      expect(result).toHaveProperty('ready_to_complete');
      expect(mockConstatsService.getConstatByQrToken).toHaveBeenCalledWith(token);
    });
  });

  describe('completeConstat', () => {
    it('should complete a constat', async () => {
      const token = '00000000-0000-0000-0000-000000000001';
      const mockRequest = { user: { id: 'user-b' } };
      const mockConstat = { id: 'constat-123', status: 'complet' };

      mockQrCodeService.validateQrToken.mockReturnValue(true);
      mockConstatsService.completeConstat.mockResolvedValue(mockConstat);

      const result = await controller.completeConstat(
        token,
        mockRequest as any,
        {} as any
      );

      expect(result).toBeDefined();
      expect(result.statut).toBe('complet');
    });
  });
});
