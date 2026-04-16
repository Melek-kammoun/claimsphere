import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contracts')
export class ContractsController {
  private readonly logger = new Logger('ContractsController');

  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createContractDto: CreateContractDto,
    @Request() req: { user: { id: string } },
  ) {
    this.logger.log(`🔍 POST /contracts for user ${req.user.id}`);
    const contract = await this.contractsService.create({
      ...createContractDto,
      client_id: req.user.id,
    });
    return {
      success: true,
      data: contract,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req: { user: { id: string } }) {
    this.logger.log(`🔍 GET /contracts for user ${req.user.id}`);
    const contracts = await this.contractsService.findByUser(req.user.id);
    this.logger.log(`✅ Found ${contracts.length} contracts`);
    return {
      success: true,
      data: contracts,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    this.logger.log(`🔍 GET /contracts/${id}`);
    const contract = await this.contractsService.findOne(+id);
    return {
      success: true,
      data: contract,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
  ) {
    this.logger.log(`🔍 PATCH /contracts/${id}`);
    const contract = await this.contractsService.update(+id, updateContractDto);
    return {
      success: true,
      data: contract,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    this.logger.log(`🔍 DELETE /contracts/${id}`);
    const result = await this.contractsService.remove(+id);
    return {
      success: true,
      data: result,
    };
  }
}