import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTripDto {
  @ApiProperty({ description: 'Route ID' })
  @IsString()
  routeId!: string;

  @ApiProperty({ description: 'Driver user ID' })
  @IsString()
  driverId!: string;

  @ApiProperty({ description: 'Vehicle ID' })
  @IsString()
  vehicleId!: string;

  @ApiProperty({ description: 'Cargo ID' })
  @IsString()
  cargoId!: string;
}
