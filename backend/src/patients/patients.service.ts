import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PatientNotFoundException } from '@/common/exceptions';
import { CreatePatientDto, UpdatePatientDto } from './dto';

export interface PatientEntity {
  id: string;
  userId: string;
  name: string;
  age: number | null;
  gender: string | null;
  relation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePatientDto): Promise<PatientEntity> {
    const patient = await this.prisma.patient.create({
      data: {
        userId,
        name: dto.name,
        age: dto.age,
        gender: dto.gender,
        relation: dto.relation,
      },
    });

    return this.mapToEntity(patient);
  }

  async findAll(userId: string): Promise<PatientEntity[]> {
    const patients = await this.prisma.patient.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return patients.map(this.mapToEntity);
  }

  async findOne(userId: string, id: string): Promise<PatientEntity> {
    const patient = await this.prisma.patient.findFirst({
      where: { id, userId },
    });

    if (!patient) {
      throw new PatientNotFoundException(id);
    }

    return this.mapToEntity(patient);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdatePatientDto,
  ): Promise<PatientEntity> {
    await this.findOne(userId, id);

    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        name: dto.name,
        age: dto.age,
        gender: dto.gender,
        relation: dto.relation,
      },
    });

    return this.mapToEntity(patient);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);

    await this.prisma.patient.delete({
      where: { id },
    });
  }

  private mapToEntity(patient: any): PatientEntity {
    return {
      id: patient.id,
      userId: patient.userId,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      relation: patient.relation,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }
}
