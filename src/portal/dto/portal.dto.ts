import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class PortalRegisterDto {
  @ApiProperty({ example: 'Ada Okoro' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass1', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ required: false, example: '08012345678' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class PortalLoginDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass1', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class PortalComplaintDto {
  @ApiProperty({ example: 'Disconnection without notice' })
  @IsString()
  @MinLength(8)
  message: string;

  @ApiProperty({
    required: false,
    enum: ['complaint', 'inquiry', 'general'],
    default: 'complaint',
  })
  @IsOptional()
  @IsString()
  type?: 'complaint' | 'inquiry' | 'general';
}
