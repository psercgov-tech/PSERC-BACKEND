import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { PortalOrAdminGuard } from '../common/guards/portal-or-admin.guard';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list() {
    return this.documentsService.list();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(PortalOrAdminGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get(':id/download')
  download(@Param('id') id: string, @Res() res: Response) {
    return this.documentsService.stream(id, 'attachment', res);
  }

  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  @Get(':id')
  view(@Param('id') id: string, @Res() res: Response) {
    return this.documentsService.stream(id, 'inline', res);
  }
}
