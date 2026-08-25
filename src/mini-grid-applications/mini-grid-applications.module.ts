import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MiniGridApplication,
  MiniGridApplicationSchema,
} from './mini-grid-application.schema';
import { MiniGridApplicationsController } from './mini-grid-applications.controller';
import { MiniGridApplicationsService } from './mini-grid-applications.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MiniGridApplication.name,
        schema: MiniGridApplicationSchema,
      },
    ]),
  ],
  controllers: [MiniGridApplicationsController],
  providers: [MiniGridApplicationsService],
  exports: [MiniGridApplicationsService],
})
export class MiniGridApplicationsModule {}
