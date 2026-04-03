import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

const contractorInclude = {
  senderContractor: {
    select: { id: true, name: true, inn: true },
  },
  receiverContractor: {
    select: { id: true, name: true, inn: true },
  },
};

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.route.findMany({
      include: contractorInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: contractorInclude,
    });
    if (!route) {
      throw new NotFoundException('Route not found');
    }
    return route;
  }

  async create(dto: CreateRouteDto) {
    return this.prisma.route.create({
      data: dto,
      include: contractorInclude,
    });
  }

  async update(id: string, dto: UpdateRouteDto) {
    await this.findOne(id);

    return this.prisma.route.update({
      where: { id },
      data: dto,
      include: contractorInclude,
    });
  }
}
