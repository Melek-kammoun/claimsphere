import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { AuthGuard } from '../auth.guard';
@Controller('contracts')
@UseGuards(AuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  findAll() {
    return this.contractsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(+id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.contractsService.findByUser(userId);
  }

  @Post()
  create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
  )
   {
  return this.contractsService.update(+id, updateContractDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractsService.remove(+id);
  }
}
