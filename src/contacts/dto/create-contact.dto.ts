import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  message: string;

  @ApiPropertyOptional({
    enum: ['complaint', 'inquiry', 'general'],
    default: 'inquiry',
  })
  @IsOptional()
  @IsIn(['complaint', 'inquiry', 'general'])
  type?: 'complaint' | 'inquiry' | 'general';
}

export class UpdateContactStatusDto {
  @ApiProperty({ enum: ['open', 'pending', 'resolved'] })
  @IsIn(['open', 'pending', 'resolved'])
  status: 'open' | 'pending' | 'resolved';
}
