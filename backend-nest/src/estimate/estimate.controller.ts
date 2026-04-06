import { Body, Controller, Post } from '@nestjs/common';
import { EstimateService } from './estimate.service';
import { EstimateVehicleDto } from './estimate.dto';

// On expose le même endpoint que dans le frontend existant
@Controller('api/estimate-vehicle')
export class EstimateController {
  constructor(private readonly estimateService: EstimateService) {}

  @Post()
  async estimateVehicle(@Body() estimateDto: EstimateVehicleDto) {
    return this.estimateService.estimateVehicle(estimateDto);
  }
}
