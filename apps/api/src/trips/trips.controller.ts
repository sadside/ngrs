import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UserRole } from '@ngrs/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripStatusDto } from './dto/update-trip-status.dto';
import { TripFilterDto } from './dto/trip-filter.dto';

@ApiTags('trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LOGIST)
  findAll(@Query() filters: TripFilterDto) {
    return this.tripsService.findAll(filters);
  }

  @Get('my')
  @Roles(UserRole.DRIVER)
  findMyTrips(@CurrentUser() user: User) {
    return this.tripsService.findMyTrips(user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGIST, UserRole.DRIVER)
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LOGIST)
  create(@Body() dto: CreateTripDto) {
    return this.tripsService.create(dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.DRIVER)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTripStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.updateStatus(id, dto.status, user.id);
  }
}
