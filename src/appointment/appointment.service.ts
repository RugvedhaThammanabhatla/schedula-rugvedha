import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from './appointment.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async createAppointment(body: any) {
    const duplicate =
      await this.appointmentRepository.findOne({
        where: {
          doctorId: body.doctorId,
          appointmentDate: body.appointmentDate,
          startTime: body.startTime,
          endTime: body.endTime,
        },
      });

    if (duplicate) {
      throw new BadRequestException(
        'Slot already booked',
      );
    }

    const appointment =
      this.appointmentRepository.create(body);

    return await this.appointmentRepository.save(
      appointment,
    );
  }
}