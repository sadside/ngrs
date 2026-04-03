import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';

@Injectable()
export class CargosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cargo.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const cargo = await this.prisma.cargo.findUnique({
      where: { id },
    });
    if (!cargo) {
      throw new NotFoundException('Cargo not found');
    }
    return cargo;
  }

  async create(dto: CreateCargoDto) {
    return this.prisma.cargo.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateCargoDto) {
    await this.findOne(id);

    return this.prisma.cargo.update({
      where: { id },
      data: dto,
    });
  }
}
