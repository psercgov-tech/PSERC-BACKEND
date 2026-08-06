import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({ example: 'Kanneng Gwom' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: 'kg',
    description: 'Staff initials used before @pserc.plateau.gov.ng',
  })
  @IsString()
  @Matches(/^[a-zA-Z]{2,6}$/, {
    message: 'Initials must be 2–6 letters only',
  })
  initials: string;

  @ApiProperty({ example: 'StaffPass1', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateStaffDto {
  @ApiPropertyOptional({ example: 'Kanneng Gwom' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'NewPass123', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
