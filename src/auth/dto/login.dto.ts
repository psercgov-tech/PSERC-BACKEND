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
}
