import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  PortalComplaintDto,
  PortalLoginDto,
  PortalRegisterDto,
} from './dto/portal.dto';
import { PortalJwtAuthGuard } from './guards/portal-jwt-auth.guard';
import { PortalJwtPayload } from './portal-jwt-payload';
import { PortalService } from './portal.service';

@ApiTags('portal')
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Post('auth/register')
  register(@Body() dto: PortalRegisterDto) {
    return this.portalService.register(dto);
  }

  @Post('auth/login')
  login(@Body() dto: PortalLoginDto) {
    return this.portalService.login(dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(PortalJwtAuthGuard)
  @Get('auth/me')
  me(@CurrentUser() user: PortalJwtPayload) {
    return this.portalService.me(user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(PortalJwtAuthGuard)
  @Post('auth/logout')
  logout() {
    return { ok: true };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(PortalJwtAuthGuard)
  @Get('complaints')
  listComplaints(@CurrentUser() user: PortalJwtPayload) {
    return this.portalService.listComplaints(user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(PortalJwtAuthGuard)
  @Post('complaints')
  createComplaint(
    @CurrentUser() user: PortalJwtPayload,
    @Body() dto: PortalComplaintDto,
  ) {
    return this.portalService.createComplaint(user.sub, dto);
  }
}
