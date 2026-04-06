import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateContratDto, UpdateContratStatusDto } from './contrats.dto';
import { ContratsService } from './contrats.service';

@Controller('api/contrats')
export class ContratsController {
  constructor(private readonly contratsService: ContratsService) {}

  @Post()
  createContrat(@Body() createContratDto: CreateContratDto) {
    return this.contratsService.createContrat(createContratDto);
  }

  @Get()
  getAllContrats(@Query('status') status?: string) {
    return this.contratsService.getAllContrats(status);
  }

  @Get('pending')
  getPendingContrats() {
    return this.contratsService.getPendingContrats();
  }

  @Get('client/:clientId')
  getContratsByClientId(@Param('clientId') clientId: string) {
    return this.contratsService.getContratsByClientId(clientId);
  }

  @Get(':id')
  getContratById(@Param('id', ParseIntPipe) id: number) {
    return this.contratsService.getContratById(id);
  }

  @Patch(':id/status')
  updateContratStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContratStatusDto: UpdateContratStatusDto,
  ) {
    return this.contratsService.updateContratStatus(
      id,
      updateContratStatusDto.status,
    );
  }
}
