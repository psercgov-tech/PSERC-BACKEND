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
import { UpdateDiscoMonthlyReportStatusDto } from './dto/disco-monthly-report.dto';
import { DiscoMonthlyReportsService } from './disco-monthly-reports.service';

@ApiTags('disco-monthly-reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('disco-monthly-reports')
export class DiscoMonthlyReportsController {
  constructor(private readonly service: DiscoMonthlyReportsService) {}

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
    @Body() dto: UpdateDiscoMonthlyReportStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
