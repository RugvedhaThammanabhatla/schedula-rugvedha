import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

import { Doctor } from './doctor.entity';
import { RecurringAvailability } from './recurring-availability.entity';
import { CustomAvailability } from './custom-availability.entity';
import { Appointment } from '../appointment/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Doctor,
      RecurringAvailability,
      CustomAvailability,
      Appointment
    ]),
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}