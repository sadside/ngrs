import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';
import { VehicleOwnershipType } from '@iridium/shared';

export class CreateVehicleDto {
  @ApiProperty({ example: 'СКАНИЯ' })
  @IsString()
  brand!: string;

  @ApiProperty({ example: 'R440' })
  @IsString()
  model!: string;

  @ApiProperty({ example: 'Е063НМ156' })
  @IsString()
  licensePlate!: string;

  @ApiProperty({ example: 'ВК861256', required: false })
  @IsString()
  @IsOptional()
  trailerPlate?: string;

  @ApiProperty({ example: 25.04, required: false })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiProperty({ example: 41.36, required: false })
  @IsNumber()
  @IsOptional()
  volumeCapacity?: number;

  @ApiProperty({ enum: VehicleOwnershipType, example: VehicleOwnershipType.GRATUITOUS })
  @IsEnum(VehicleOwnershipType)
  ownershipType!: VehicleOwnershipType;

  @ApiProperty({ required: false, description: 'Driver user ID to assign' })
  @IsString()
  @IsOptional()
  assignedDriverId?: string;

  @ApiProperty({ required: false, type: [String], description: 'Cargo IDs allowed for this vehicle' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedCargoIds?: string[];
}
