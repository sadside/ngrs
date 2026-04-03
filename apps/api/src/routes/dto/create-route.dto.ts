import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateRouteDto {
  @ApiProperty({ description: 'Sender contractor ID' })
  @IsString()
  senderContractorId!: string;

  @ApiProperty({ description: 'Receiver contractor ID' })
  @IsString()
  receiverContractorId!: string;

  @ApiProperty({ example: 'Оренбургская обл., Переволоцкий, ул. Промышленная, д.4' })
  @IsString()
  loadingAddress!: string;

  @ApiProperty({ example: 'Оренбургский район, с/с Подгородне-Покровский, 26 км' })
  @IsString()
  unloadingAddress!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
