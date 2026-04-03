import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '@iridium/shared';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({ required: false })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}
