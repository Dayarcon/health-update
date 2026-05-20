import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators';
import { PatientEntity } from './patients.service';

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface DeleteResponse {
  success: true;
  data: {
    message: string;
  };
}

@Controller('patients')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreatePatientDto,
  ): Promise<SuccessResponse<PatientEntity>> {
    const patient = await this.patientsService.create(user.sub, dto);

    return {
      success: true,
      data: patient,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser() user: any): Promise<SuccessResponse<PatientEntity[]>> {
    const patients = await this.patientsService.findAll(user.sub);

    return {
      success: true,
      data: patients,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<SuccessResponse<PatientEntity>> {
    const patient = await this.patientsService.findOne(user.sub, id);

    return {
      success: true,
      data: patient,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<SuccessResponse<PatientEntity>> {
    const patient = await this.patientsService.update(user.sub, id, dto);

    return {
      success: true,
      data: patient,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<DeleteResponse> {
    await this.patientsService.remove(user.sub, id);

    return {
      success: true,
      data: {
        message: 'Patient deleted successfully',
      },
    };
  }
}
