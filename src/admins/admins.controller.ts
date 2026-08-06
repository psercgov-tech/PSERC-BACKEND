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
import { AdminsService } from './admins.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';

@ApiTags('admins')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  list() {
    return this.adminsService.listStaff();
  }

  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this.adminsService.createStaff(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.adminsService.updateStaff(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminsService.removeStaff(id);
  }
}
