import { Injectable, NotFoundException } from '@nestjs/common';
import { ContractorType } from '@iridium/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@Injectable()
export class ContractorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: ContractorType) {
    return this.prisma.contractor.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id },
    });
    if (!contractor) {
      throw new NotFoundException(`Contractor with id ${id} not found`);
    }
    return contractor;
  }

  async create(dto: CreateContractorDto) {
    return this.prisma.contractor.create({ data: dto });
  }

  async update(id: string, dto: UpdateContractorDto) {
    await this.findOne(id);
    return this.prisma.contractor.update({
      where: { id },
      data: dto,
    });
  }
}
