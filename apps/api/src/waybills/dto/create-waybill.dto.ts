import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateWaybillDto {
  @ApiProperty({ description: 'Trip ID' })
  @IsString()
  tripId!: string;

  @ApiProperty({ example: '593' })
  @IsString()
  ttnNumber!: string;

  @ApiProperty({ example: 25.04, description: 'Weight in tonnes' })
  @IsNumber()
  weight!: number;

  @ApiProperty({ example: 41.36, description: 'Load weight (gross) in tonnes' })
  @IsNumber()
  loadWeight!: number;

  @ApiProperty({ example: 'Шведкин О.Ю.' })
  @IsString()
  driverFullName!: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  submittedOffline?: boolean;
}
