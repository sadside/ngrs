import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { TripStatus } from '@ngrs/shared';

export class TripFilterDto {
  @ApiProperty({ enum: TripStatus, required: false })
  @IsEnum(TripStatus)
  @IsOptional()
  status?: TripStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  routeId?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
