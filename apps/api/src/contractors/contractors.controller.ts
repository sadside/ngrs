import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ContractorType, UserRole } from '@ngrs/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@ApiTags('Contractors')
@Controller('contractors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.LOGIST)
@ApiBearerAuth()
export class ContractorsController {
  constructor(private contractorsService: ContractorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all contractors' })
  @ApiQuery({ name: 'type', enum: ContractorType, required: false })
  findAll(@Query('type') type?: ContractorType) {
    return this.contractorsService.findAll(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contractor by id' })
  findOne(@Param('id') id: string) {
    return this.contractorsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a contractor' })
  create(@Body() dto: CreateContractorDto) {
    return this.contractorsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contractor' })
  update(@Param('id') id: string, @Body() dto: UpdateContractorDto) {
    return this.contractorsService.update(id, dto);
  }
}
