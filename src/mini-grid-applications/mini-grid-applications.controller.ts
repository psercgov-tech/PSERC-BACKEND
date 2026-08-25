import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateMiniGridApplicationDto,
  UpdateMiniGridApplicationDto,
  UpdateMiniGridApplicationStatusDto,
} from './dto/mini-grid-application.dto';
import { MiniGridApplicationsService } from './mini-grid-applications.service';

@ApiTags('mini-grid-applications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('mini-grid-applications')
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

  @Post()
  create(@Body() dto: CreateMiniGridApplicationDto) {
    return this.service.createFromAdmin(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMiniGridApplicationDto) {
    return this.service.update(id, dto);
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
