import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@iridium/shared';

export class CreateUserDto {
  @ApiProperty({ example: 'petrov' })
  @IsString()
  @MinLength(3)
  login!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Петров Пётр Петрович' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: '+79001234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.DRIVER })
  @IsEnum(UserRole)
  role!: UserRole;
}
