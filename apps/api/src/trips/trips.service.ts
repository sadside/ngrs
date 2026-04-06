import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TripStatus } from '@ngrs/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripFilterDto } from './dto/trip-filter.dto';

const tripInclude = {
  route: {
    include: {
      senderContractor: { select: { id: true, name: true } },
      receiverContractor: { select: { id: true, name: true } },
    },
  },
  driver: { select: { id: true, fullName: true, phone: true } },
  vehicle: {
    select: { id: true, brand: true, model: true, licensePlate: true },
  },
  cargo: { select: { id: true, name: true } },
  waybill: true,
};

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(filters: TripFilterDto) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.driverId) {
      where.driverId = filters.driverId;
    }
    if (filters.routeId) {
      where.routeId = filters.routeId;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.assignedAt = {};
      if (filters.dateFrom) {
        where.assignedAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.assignedAt.lte = new Date(filters.dateTo);
      }
    }

    return this.prisma.trip.findMany({
      where,
      include: tripInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyTrips(driverId: string) {
    return this.prisma.trip.findMany({
      where: { driverId },
      include: tripInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: tripInclude,
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return trip;
  }

  async create(dto: CreateTripDto) {
    return this.prisma.trip.create({
      data: {
        ...dto,
        status: TripStatus.ASSIGNED,
      },
      include: tripInclude,
    });
  }

  async updateStatus(id: string, status: TripStatus, userId: string) {
    const trip = await this.findOne(id);

    if (trip.driverId !== userId) {
      throw new ForbiddenException(
        'Only the assigned driver can update trip status',
      );
    }

    const data: any = { status };

    if (status === TripStatus.EN_ROUTE_TO_LOADING) {
      data.startedAt = new Date();
    }
    if (status === TripStatus.COMPLETED) {
      data.completedAt = new Date();
    }

    const updated = await this.prisma.trip.update({
      where: { id },
      data,
      include: tripInclude,
    });

    this.notifications.emit('trip-status-changed', {
      tripId: id,
      status,
      driverName: trip.driver.fullName,
    });

    return updated;
  }
}
