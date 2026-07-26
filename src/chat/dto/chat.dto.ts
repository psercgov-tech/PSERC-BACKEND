import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionKey?: string;
}

export class IntroduceDto {
  @ApiProperty()
  @IsString()
  sessionKey: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  newsletter?: boolean;
}

export class AskDto {
  @ApiProperty()
  @IsString()
  sessionKey: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  message: string;
}
