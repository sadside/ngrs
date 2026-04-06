import { Injectable, NotFoundException } from '@nestjs/common';
import { VehicleStatus } from '@ngrs/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  private readonly defaultInclude = {
    assignedDriver: {
      select: { id: true, fullName: true },
    },
    allowedCargos: {
      include: {
        cargo: { select: { id: true, name: true } },
      },
    },
  };

  async findAll(status?: VehicleStatus) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    return this.prisma.vehicle.findMany({
      where,
      include: this.defaultInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: this.defaultInclude,
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    const { allowedCargoIds, ...data } = dto;

    return this.prisma.vehicle.create({
      data: {
        ...data,
        allowedCargos: allowedCargoIds?.length
          ? {
              create: allowedCargoIds.map((cargoId) => ({ cargoId })),
            }
          : undefined,
      },
      include: this.defaultInclude,
    });
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);

    const { allowedCargoIds, ...data } = dto;

    if (allowedCargoIds) {
      await this.prisma.vehicleCargo.deleteMany({ where: { vehicleId: id } });
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...data,
        allowedCargos: allowedCargoIds
          ? {
              create: allowedCargoIds.map((cargoId) => ({ cargoId })),
            }
          : undefined,
      },
      include: this.defaultInclude,
    });
  }
}
