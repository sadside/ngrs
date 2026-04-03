import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TripStatus } from '@iridium/shared';

export class UpdateTripStatusDto {
  @ApiProperty({ enum: TripStatus })
  @IsEnum(TripStatus)
  status!: TripStatus;
}
