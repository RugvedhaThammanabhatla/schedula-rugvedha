import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from './appointment.entity';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

import { Doctor } from '../doctor/doctor.entity';
import { Patient } from '../patient/patient.entity';
import { RecurringAvailability }
from '../doctor/recurring-availability.entity';

import { CustomAvailability }
from '../doctor/custom-availability.entity';
import { NotificationModule }
from '../notification/notification.module';
import { AppointmentReminderService }
from './appointment-reminder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Doctor,
      Patient,
      RecurringAvailability,
      CustomAvailability
    ]),
    NotificationModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService,AppointmentReminderService],
})
export class AppointmentModule {}