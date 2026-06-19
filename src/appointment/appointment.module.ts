import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from './appointment.entity';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

import { Doctor } from '../doctor/doctor.entity';
import { Patient } from '../patient/patient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Doctor,
      Patient,
    ]),
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}