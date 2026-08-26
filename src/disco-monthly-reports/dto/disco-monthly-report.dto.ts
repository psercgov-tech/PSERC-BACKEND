import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

function toInt(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    return Number.parseInt(value, 10);
  }
  return value;
}

export class CreateDiscoMonthlyReportDto {
  @ApiProperty({ example: 'Jos Electricity Distribution Plc (JED)' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  discoName: string;

  @ApiProperty({ example: 3 })
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(12)
  reportMonth: number;

  @ApiProperty({ example: 2026 })
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(2000)
  @Max(2100)
  reportYear: number;

  @ApiPropertyOptional({ example: 'March operational summary' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateDiscoMonthlyReportStatusDto {
  @ApiProperty({ enum: ['open', 'pending', 'resolved'] })
  @IsIn(['open', 'pending', 'resolved'])
  status: 'open' | 'pending' | 'resolved';
}
