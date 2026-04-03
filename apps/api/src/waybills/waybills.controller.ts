import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@iridium/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WaybillsService } from './waybills.service';
import { CreateWaybillDto } from './dto/create-waybill.dto';
import { WaybillFilterDto } from './dto/waybill-filter.dto';

@ApiTags('waybills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('waybills')
export class WaybillsController {
  constructor(private readonly waybillsService: WaybillsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LOGIST)
  findAll(@Query() filters: WaybillFilterDto) {
    return this.waybillsService.findAll(filters);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGIST)
  findOne(@Param('id') id: string) {
    return this.waybillsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.DRIVER)
  create(@Body() dto: CreateWaybillDto) {
    return this.waybillsService.create(dto);
  }
}
