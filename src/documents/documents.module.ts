import { Module } from '@nestjs/common';
import { PortalOrAdminGuard } from '../common/guards/portal-or-admin.guard';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, PortalOrAdminGuard],
})
export class DocumentsModule {}
