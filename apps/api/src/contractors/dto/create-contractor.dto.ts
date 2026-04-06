import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ContractorType } from '@ngrs/shared';

export class CreateContractorDto {
  @ApiProperty({ example: 'ООО "Интерком"' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '5609182980', required: false })
  @IsString()
  @IsOptional()
  inn?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  legalAddress?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  actualAddress?: string;

  @ApiProperty({ enum: ContractorType, example: ContractorType.SENDER })
  @IsEnum(ContractorType)
  type!: ContractorType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contactPerson?: string;
}
