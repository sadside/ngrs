import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class WaybillFilterDto {
  @ApiProperty({ required: false, description: 'Search by TTN number' })
  @IsString()
  @IsOptional()
  ttnNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
