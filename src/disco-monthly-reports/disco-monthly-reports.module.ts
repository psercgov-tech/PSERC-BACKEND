import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import {
  DiscoMonthlyReport,
  DiscoMonthlyReportSchema,
} from './disco-monthly-report.schema';
import { DiscoMonthlyReportsController } from './disco-monthly-reports.controller';
import { DiscoMonthlyReportsService } from './disco-monthly-reports.service';

@Module({
  imports: [
    CloudinaryModule,
    MongooseModule.forFeature([
      {
        name: DiscoMonthlyReport.name,
        schema: DiscoMonthlyReportSchema,
      },
    ]),
  ],
  controllers: [DiscoMonthlyReportsController],
  providers: [DiscoMonthlyReportsService],
  exports: [DiscoMonthlyReportsService],
})
export class DiscoMonthlyReportsModule {}
