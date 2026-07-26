import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@pserc.ng' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@123456', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Stable browser fingerprint for session binding',
    example: 'a1b2c3d4e5f6789012345678',
  })
  @IsString()
  @MinLength(16)
  deviceFingerprint: string;
}
