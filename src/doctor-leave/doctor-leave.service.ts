import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DoctorLeave } from './doctor-leave.entity';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentStatus } from '../appointment/appointment.entity';

import { CreateDoctorLeaveDto } from './dto/create-doctor-leave.dto';
import { UpdateDoctorLeaveDto } from './dto/update-doctor-leave.dto';

@Injectable()
export class DoctorLeaveService {
  constructor(
    @InjectRepository(DoctorLeave)
    private leaveRepository: Repository<DoctorLeave>,

    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async create(doctorId: number, dto: CreateDoctorLeaveDto) {
    const today = new Date().toISOString().split('T')[0];

    if (dto.leaveDate < today) {
      throw new BadRequestException(
        'Past leave date is not allowed',
      );
    }

    const duplicate = await this.leaveRepository.findOne({
      where: {
        doctorId,
        leaveDate: dto.leaveDate,
      },
    });

    if (duplicate) {
      throw new BadRequestException(
        'Leave already exists for this date',
      );
    }

    const appointment = await this.appointmentRepository.findOne({
      where: {
        doctorId,
        appointmentDate: dto.leaveDate,
        status: AppointmentStatus.BOOKED,
      },
    });

    if (appointment) {
      throw new BadRequestException(
        'Appointments are already scheduled on this date. Please cancel or reschedule existing appointments first.',
      );
    }

    return this.leaveRepository.save({
      doctorId,
      ...dto,
    });
  }

  async findAll(doctorId: number) {
    return this.leaveRepository.find({
      where: { doctorId },
    });
  }

  async update(
    id: number,
    doctorId: number,
    dto: UpdateDoctorLeaveDto,
  ) {
    const leave = await this.leaveRepository.findOne({
      where: { id, doctorId },
    });

    if (!leave) {
      throw new BadRequestException(
        'Leave not found',
      );
    }

    Object.assign(leave, dto);

    return this.leaveRepository.save(leave);
  }

  async remove(id: number, doctorId: number) {
    const leave = await this.leaveRepository.findOne({
      where: { id, doctorId },
    });

    if (!leave) {
      throw new BadRequestException(
        'Leave not found',
      );
    }

    await this.leaveRepository.remove(leave);

    return {
      message: 'Leave deleted successfully',
    };
  }
}