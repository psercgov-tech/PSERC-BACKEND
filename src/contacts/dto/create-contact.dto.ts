import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(4000)
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
