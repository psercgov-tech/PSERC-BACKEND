import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateMiniGridApplicationStatusDto } from './dto/mini-grid-application.dto';
import { MiniGridApplicationsService } from './mini-grid-applications.service';

@ApiTags('license-applications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('license-applications')
export class MiniGridApplicationsController {
  constructor(private readonly service: MiniGridApplicationsService) {}

  @Get()
  findAll() {
    return this.service.listAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMiniGridApplicationStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
