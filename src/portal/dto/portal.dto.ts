import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PortalRegisterDto {
  @ApiProperty({ example: 'Ada Okoro' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'AtLeast8Chars', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ required: false, example: '08012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiProperty({
    description: 'Browser fingerprint for session binding',
  })
  @IsString()
  @MinLength(16)
  @MaxLength(128)
  deviceFingerprint: string;
}

export class PortalLoginDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'AtLeast8Chars', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({
    description: 'Browser fingerprint for session binding',
  })
  @IsString()
  @MinLength(16)
  @MaxLength(128)
  deviceFingerprint: string;
}

export class PortalComplaintDto {
  @ApiProperty({ example: 'Disconnection without notice' })
  @IsString()
  @MinLength(8)
  @MaxLength(4000)
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

export class PortalForgotPasswordDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class PortalResetPasswordDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiProperty({ example: '482910', description: '6-digit code from email' })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Code must be exactly 6 digits' })
  code?: string;

  /** Legacy: single token from older emails. */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  token?: string;

  /** Legacy: user id with `reset` link param. */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  uid?: string;

  /** Legacy: opaque reset segment with `uid`. */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reset?: string;

  @ApiProperty({ example: 'NewStrongPass1', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  newPassword: string;
}
