import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateCargoDto {
  @ApiProperty({ example: 'Конденсат газовый смесевой' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'ТУ 19.20.32-001-20484253-2018', required: false })
  @IsString()
  @IsOptional()
  technicalSpec?: string;

  @ApiProperty({ example: 'UN 3295', required: false })
  @IsString()
  @IsOptional()
  unCode?: string;

  @ApiProperty({ example: '3', required: false })
  @IsString()
  @IsOptional()
  hazardClass?: string;

  @ApiProperty({ example: 'наливом', required: false })
  @IsString()
  @IsOptional()
  packagingMethod?: string;
}
