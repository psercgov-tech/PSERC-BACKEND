import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMiniGridApplicationDto {
  @ApiProperty({ example: 'Plateau Green Power Ltd' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName: string;

  @ApiProperty({ example: '12 Ahmadu Bello Way, Jos' })
  @IsString()
  @MinLength(3)
  @MaxLength(400)
  physicalAddress: string;

  @ApiProperty({ example: 'P.O. Box 1234, Jos' })
  @IsString()
  @MinLength(2)
  @MaxLength(400)
  postalAddress: string;

  @ApiProperty({ example: '+234 73 123 4567' })
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  tel: string;

  @ApiProperty({ example: '+234 801 234 5678' })
  @IsString()
  @MinLength(7)
  @MaxLength(40)
  mobilePhone: string;

  @ApiProperty({ example: 'info@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @ApiProperty({ example: 'Barkin Ladi Mini-Grid' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  siteName: string;

  @ApiProperty({ example: '9.5333, 8.9000' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  geoCoordinates: string;

  @ApiProperty({ example: 'Ada Okoro' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  contactPersonName: string;

  @ApiProperty({ example: '+234 809 111 2233' })
  @IsString()
  @MinLength(7)
  @MaxLength(40)
  contactPersonMobile: string;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  @MaxLength(254)
  contactPersonEmail: string;
}

export class UpdateMiniGridApplicationDto extends PartialType(
  CreateMiniGridApplicationDto,
) {
  @ApiPropertyOptional({ enum: ['open', 'pending', 'resolved'] })
  @IsOptional()
  @IsIn(['open', 'pending', 'resolved'])
  status?: 'open' | 'pending' | 'resolved';
}

export class UpdateMiniGridApplicationStatusDto {
  @ApiProperty({ enum: ['open', 'pending', 'resolved'] })
  @IsIn(['open', 'pending', 'resolved'])
  status: 'open' | 'pending' | 'resolved';
}
