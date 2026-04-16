import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger('NotificationsController');

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    this.logger.log('🔍 POST /notifications');
    const notification = await this.notificationsService.create(createNotificationDto);
    return {
      success: true,
      data: notification,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req: { user: { id: string } }) {
    this.logger.log(`🔍 GET /notifications for user ${req.user.id}`);
    const notifications = await this.notificationsService.findAll();
    this.logger.log(`✅ Found ${notifications.length} notifications`);
    return {
      success: true,
      data: notifications,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    this.logger.log(`🔍 GET /notifications/${id}`);
    const notification = await this.notificationsService.findOne(+id);
    return {
      success: true,
      data: notification,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    this.logger.log(`🔍 PATCH /notifications/${id}`);
    const notification = await this.notificationsService.update(+id, updateNotificationDto);
    return {
      success: true,
      data: notification,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    this.logger.log(`🔍 DELETE /notifications/${id}`);
    const result = await this.notificationsService.remove(+id);
    return {
      success: true,
      data: result,
    };
  }
}