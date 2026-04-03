import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@iridium/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CargosService } from './cargos.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';

@ApiTags('cargos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.LOGIST)
@Controller('cargos')
export class CargosController {
  constructor(private readonly cargosService: CargosService) {}

  @Get()
  findAll() {
    return this.cargosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cargosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCargoDto) {
    return this.cargosService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCargoDto) {
    return this.cargosService.update(id, dto);
  }
}
