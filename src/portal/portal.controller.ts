import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  PortalComplaintDto,
  PortalForgotPasswordDto,
  PortalLoginDto,
  PortalRegisterDto,
  PortalResetPasswordDto,
} from './dto/portal.dto';
import { PortalJwtAuthGuard } from './guards/portal-jwt-auth.guard';
import { PortalJwtPayload } from './portal-jwt-payload';
import { PortalService } from './portal.service';
import { CreateMiniGridApplicationDto } from '../mini-grid-applications/dto/mini-grid-application.dto';
import { CreateDiscoMonthlyReportDto } from '../disco-monthly-reports/dto/disco-monthly-report.dto';

@ApiTags('portal')
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('auth/register')
  register(@Body() dto: PortalRegisterDto, @Req() req: Request) {
    return this.portalService.register(dto, req.header('user-agent'));
  }

  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('auth/login')
  login(@Body() dto: PortalLoginDto, @Req() req: Request) {
    return this.portalService.login(dto, req.header('user-agent'));
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('auth/forgot-password')
  forgotPassword(@Body() dto: PortalForgotPasswordDto) {
    return this.portalService.forgotPassword(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('auth/reset-password')
  resetPassword(@Body() dto: PortalResetPasswordDto) {
    return this.portalService.resetPassword(dto);
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
  logout(@CurrentUser() user: PortalJwtPayload) {
    return this.portalService.logout(user.sid);
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

  @ApiBearerAuth('access-token')
  @UseGuards(PortalJwtAuthGuard)
  @Get('license-applications')
  listMiniGridApplications(@CurrentUser() user: PortalJwtPayload) {
    return this.portalService.listMiniGridApplications(user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(PortalJwtAuthGuard)
  @Post('license-applications')
  createMiniGridApplication(
    @CurrentUser() user: PortalJwtPayload,
    @Body() dto: CreateMiniGridApplicationDto,
  ) {
    return this.portalService.createMiniGridApplication(user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(PortalJwtAuthGuard)
  @Get('disco-monthly-reports')
  listDiscoMonthlyReports(@CurrentUser() user: PortalJwtPayload) {
    return this.portalService.listDiscoMonthlyReports(user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(PortalJwtAuthGuard)
  @Post('disco-monthly-reports')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['discoName', 'reportMonth', 'reportYear', 'file'],
      properties: {
        discoName: { type: 'string' },
        reportMonth: { type: 'integer' },
        reportYear: { type: 'integer' },
        notes: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  createDiscoMonthlyReport(
    @CurrentUser() user: PortalJwtPayload,
    @Body() dto: CreateDiscoMonthlyReportDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.portalService.createDiscoMonthlyReport(user.sub, dto, file);
  }
}
