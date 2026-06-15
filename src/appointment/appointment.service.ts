import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Appointment,
  AppointmentStatus,
} from './appointment.entity';

import { Doctor } from '../doctor/doctor.entity';
import { Patient } from '../patient/patient.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,

    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  async createAppointment(body: any) {
    const doctor =
      await this.doctorRepository.findOne({
        where: { id: body.doctorId },
      });

    if (!doctor) {
      throw new NotFoundException(
        'Doctor not found',
      );
    }

    const patient =
      await this.patientRepository.findOne({
        where: { id: body.patientId },
      });

    if (!patient) {
      throw new NotFoundException(
        'Patient not found',
      );
    }

    const appointmentDate =
      new Date(body.appointmentDate);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BadRequestException(
        'Past appointment not allowed',
      );
    }

    const duplicate =
      await this.appointmentRepository.findOne({
        where: {
          doctorId: body.doctorId,
          appointmentDate:
            body.appointmentDate,
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
      this.appointmentRepository.create({
        ...body,
        status: AppointmentStatus.BOOKED,
      });

    return await this.appointmentRepository.save(
      appointment,
    );
  }

  async getMyAppointments(
    patientId: number,
  ) {
    const appointments =
      await this.appointmentRepository.find({
        where: { patientId },
      });

    if (appointments.length === 0) {
      throw new NotFoundException(
        'No appointments found',
      );
    }

    return appointments;
  }

  async cancelAppointment(
    id: number,
    patientId: number,
  ) {
    const appointment =
      await this.appointmentRepository.findOne({
        where: { id },
      });

    if (!appointment) {
      throw new NotFoundException(
        'Appointment not found',
      );
    }

    if (
      appointment.patientId !== patientId
    ) {
      throw new BadRequestException(
        'Unauthorized cancellation',
      );
    }

    if (
      appointment.status ===
      AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Appointment already cancelled',
      );
    }

    const appointmentDate =
      new Date(
        appointment.appointmentDate,
      );

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BadRequestException(
        'Cannot cancel past appointment',
      );
    }

    appointment.status =
      AppointmentStatus.CANCELLED;

    await this.appointmentRepository.save(
      appointment,
    );

    return {
      message:
        'Appointment cancelled successfully',
    };
  }

  async getDoctorAppointments(
    doctorId: number,
  ) {
    const appointments =
      await this.appointmentRepository.find({
        where: { doctorId },
      });

    if (appointments.length === 0) {
      throw new NotFoundException(
        'No appointments found',
      );
    }

    return appointments;
  }
}