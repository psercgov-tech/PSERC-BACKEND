import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'YourAdminPassword', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({
    description: 'Stable browser fingerprint for session binding',
    example: 'a1b2c3d4e5f6789012345678',
  })
  @IsString()
  @MinLength(16)
  @MaxLength(128)
  deviceFingerprint: string;
}
