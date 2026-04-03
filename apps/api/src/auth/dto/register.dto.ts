import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ivanov' })
  @IsString()
  @MinLength(3)
  login!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Иванов Иван Иванович' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: '+79001234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
