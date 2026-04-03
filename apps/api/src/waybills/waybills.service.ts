import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateWaybillDto } from './dto/create-waybill.dto';
import { WaybillFilterDto } from './dto/waybill-filter.dto';

const waybillInclude = {
  trip: {
    include: {
      route: {
        include: {
          senderContractor: { select: { id: true, name: true } },
          receiverContractor: { select: { id: true, name: true } },
        },
      },
      driver: { select: { id: true, fullName: true } },
      vehicle: { select: { id: true, licensePlate: true } },
      cargo: { select: { id: true, name: true } },
    },
  },
};

@Injectable()
export class WaybillsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(filters: WaybillFilterDto) {
    const where: any = {};

    if (filters.ttnNumber) {
      where.ttnNumber = { contains: filters.ttnNumber, mode: 'insensitive' };
    }

    if (filters.driverId) {
      where.trip = { driverId: filters.driverId };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.submittedAt = {};
      if (filters.dateFrom) {
        where.submittedAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.submittedAt.lte = new Date(filters.dateTo);
      }
    }

    return this.prisma.waybill.findMany({
      where,
      include: waybillInclude,
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const waybill = await this.prisma.waybill.findUnique({
      where: { id },
      include: waybillInclude,
    });
    if (!waybill) {
      throw new NotFoundException('Waybill not found');
    }
    return waybill;
  }

  async create(dto: CreateWaybillDto) {
    const existing = await this.prisma.waybill.findUnique({
      where: { tripId: dto.tripId },
    });
    if (existing) {
      throw new ConflictException('Waybill already exists for this trip');
    }

    const waybill = await this.prisma.waybill.create({
      data: {
        tripId: dto.tripId,
        ttnNumber: dto.ttnNumber,
        weight: dto.weight,
        loadWeight: dto.loadWeight,
        driverFullName: dto.driverFullName,
        submittedOffline: dto.submittedOffline ?? false,
      },
      include: waybillInclude,
    });

    await this.prisma.trip.update({
      where: { id: dto.tripId },
      data: { status: 'EN_ROUTE_TO_UNLOADING' },
    });

    this.notifications.emit('waybill-submitted', {
      waybillId: waybill.id,
      ttnNumber: waybill.ttnNumber,
      driverName: waybill.driverFullName,
      weight: waybill.weight,
      loadWeight: waybill.loadWeight,
    });

    return waybill;
  }
}
