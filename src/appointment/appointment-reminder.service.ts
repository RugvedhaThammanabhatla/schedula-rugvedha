import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Appointment, AppointmentStatus } from './appointment.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification.enum';
import { Doctor } from '../doctor/doctor.entity';

@Injectable()
export class AppointmentReminderService {
  private readonly logger = new Logger(AppointmentReminderService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
  ) {}

  @Cron('0 */5 * * * *')
  async handleCron() {
    this.logger.log('Checking appointment reminders...');

    const REMINDER_WINDOW = 60;

    const appointments = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .innerJoinAndSelect('appointment.doctor', 'doctor')
      .innerJoinAndSelect('appointment.patient', 'patient')
      .where('appointment.status = :status', {
        status: AppointmentStatus.BOOKED,
      })
      .andWhere('appointment.reminderSent = :sent', {
        sent: false,
      })
      .orderBy('appointment.appointmentDate', 'ASC')
      .getMany();

    for (const appointment of appointments) {
      const doctor = appointment.doctor;
      const patient = appointment.patient;

      if (!doctor) {
        this.logger.warn(
          `Skipping appointment ${appointment.id}: doctor not found`,
        );
        continue;
      }

      if (!patient) {
        this.logger.warn(
          `Skipping appointment ${appointment.id}: patient not found`,
        );
        continue;
      }

      const appointmentTime = new Date(
        `${appointment.appointmentDate}T${appointment.startTime}`,
      );

      if (isNaN(appointmentTime.getTime())) {
        this.logger.warn(
          `Skipping appointment ${appointment.id}: invalid appointment time`,
        );
        continue;
      }

      const now = new Date();

      if (appointmentTime <= now) {
        this.logger.warn(
          `Skipping appointment ${appointment.id}: appointment already passed`,
        );
        continue;
      }

      const diffMinutes =
        (appointmentTime.getTime() - now.getTime()) / 60000;

      if (
        diffMinutes > REMINDER_WINDOW ||
        diffMinutes <= 0
      ) {
        continue;
      }

      const title = 'Appointment Reminder(1 Hour)';

      const message =
        doctor.schedulingType?.toUpperCase() === 'WAVE'
          ? this.buildWaveReminder(
              doctor,
              appointment,
            )
          : this.buildStreamReminder(
              doctor,
              appointment,
            );

      const queryRunner =
        this.dataSource.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await this.notificationService.createNotification(
          patient.id,
          title,
          message,
          NotificationType.APPOINTMENT_REMINDER,
          queryRunner.manager,
        );

        await queryRunner.manager.update(
  Appointment,
  appointment.id,
  {
    reminderSent: true,
  },
);

        await queryRunner.commitTransaction();

        this.logger.log(
  `Hourly reminder sent for appointment ${appointment.id} to patient ${patient.id}`,
);
      } catch (error: any) {
        await queryRunner.rollbackTransaction();

        this.logger.error(
          `Reminder failed for appointment ${appointment.id}: ${error.message}`,
          error.stack,
        );
      } finally {
        await queryRunner.release();
      }
    }
  } 
@Cron('0 0 9 * * *')
  async handleDailyReminder() {
    this.logger.log('Checking daily appointment reminders...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowDate = tomorrow
      .toISOString()
      .split('T')[0];

    const appointments = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .innerJoinAndSelect('appointment.doctor', 'doctor')
      .innerJoinAndSelect('appointment.patient', 'patient')
      .where('appointment.status = :status', {
        status: AppointmentStatus.BOOKED,
      })
      .andWhere(
        'appointment.dailyReminderSent = :sent',
        {
          sent: false,
        },
      )
      .andWhere(
        'appointment.appointmentDate = :date',
        {
          date: tomorrowDate,
        },
      )
      .getMany();

    for (const appointment of appointments) {
      const doctor = appointment.doctor;
      const patient = appointment.patient;

      if (!doctor || !patient) {
        this.logger.warn(
          `Skipping appointment ${appointment.id}: doctor/patient missing`,
        );
        continue;
      }

      const title = 'Appointment Reminder(1 Day)';

      const message =
        doctor.schedulingType?.toUpperCase() ===
        'WAVE'
          ? this.buildWaveReminder(
              doctor,
              appointment,
            )
          : this.buildStreamReminder(
              doctor,
              appointment,
            );

      const queryRunner =
        this.dataSource.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await this.notificationService.createNotification(
          patient.id,
          title,
          message,
          NotificationType.APPOINTMENT_REMINDER,
          queryRunner.manager,
        );

        await queryRunner.manager.update(
  Appointment,
  appointment.id,
  {
    dailyReminderSent: true,
  },
);

        await queryRunner.commitTransaction();

        this.logger.log(
  `Daily reminder sent for appointment ${appointment.id} to patient ${patient.id}`,
);
      } catch (error: any) {
        await queryRunner.rollbackTransaction();

        this.logger.error(
          `Failed daily reminder for appointment ${appointment.id}: ${error.message}`,
          error.stack,
        );
      } finally {
        await queryRunner.release();
      }
    }
  }

  private buildStreamReminder(
    doctor: Doctor,
    appointment: Appointment,
  ): string {
    return `Appointment Reminder

Doctor: Dr. ${doctor.fullName}
Date: ${appointment.appointmentDate}
Time: ${appointment.startTime} - ${appointment.endTime}`;
  }

  private buildWaveReminder(
    doctor: Doctor,
    appointment: Appointment,
  ): string {
    return `Appointment Reminder

Doctor: Dr. ${doctor.fullName}
Reporting Time: ${appointment.startTime}
Token Number: ${appointment.tokenNumber}`;
  }
}