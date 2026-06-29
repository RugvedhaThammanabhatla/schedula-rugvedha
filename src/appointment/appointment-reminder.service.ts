import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Appointment, AppointmentStatus } from './appointment.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification.enum';

@Injectable()
export class AppointmentReminderService {
  private readonly logger = new Logger(AppointmentReminderService.name);

  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private notificationService: NotificationService,
    private dataSource: DataSource,
  ) {}

  @Cron('0 */5 * * * *')
  async handleCron() {
    this.logger.log('Checking appointment reminders...');

    const REMINDER_WINDOW = 60;

    // Fix 1: Load doctor and patient via joins — eliminates N+1 queries
    const appointments = await this.appointmentRepository
       .createQueryBuilder('appointment')
.leftJoinAndSelect('appointment.doctor', 'doctor')
.leftJoinAndSelect('appointment.patient', 'patient')
      .where('appointment.status = :status', {
        status: AppointmentStatus.BOOKED,
      })
      .andWhere('appointment.reminderSent = :reminderSent', {
        reminderSent: false,
      })
      .orderBy('appointment.appointmentDate', 'ASC')
      .getMany();

    for (const appointment of appointments) {
      const doctor = appointment.doctor;
      const patient = appointment.patient;
      if (
  appointment.status === AppointmentStatus.CANCELLED ||
  appointment.status === AppointmentStatus.COMPLETED
) {
  this.logger.warn(
    `Skipping appointment ${appointment.id}: appointment is ${appointment.status}`,
  );
  continue;
}

      // Fix 2: Log invalid records instead of silently skipping
      if (!doctor) {
        this.logger.warn(
          `Skipping appointment ${appointment.id}: doctor ${appointment.doctorId} not found`,
        );
        continue;
      }

      if (!patient) {
        this.logger.warn(
          `Skipping appointment ${appointment.id}: patient ${appointment.patientId} not found`,
        );
        continue;
      }

      const appointmentTime = new Date(
        `${appointment.appointmentDate}T${appointment.startTime}`,
      );

      if (isNaN(appointmentTime.getTime())) {
        this.logger.warn(
          `Skipping appointment ${appointment.id}: invalid date/time ` +
            `"${appointment.appointmentDate}T${appointment.startTime}"`,
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

      if (diffMinutes <= REMINDER_WINDOW && diffMinutes > 0) {
        const title = 'Appointment Reminder';

        // Fix 3: Corrected Wave message formatting (no stray newlines)
         const message =
  doctor.schedulingType?.toUpperCase() === 'WAVE'
    ? `Appointment Reminder

Doctor: Dr. ${doctor.fullName}
Reporting Time: ${appointment.startTime}
Token Number: ${appointment.tokenNumber}`
    : `Appointment Reminder

Doctor: Dr. ${doctor.fullName}
Date: ${appointment.appointmentDate}
Time: ${appointment.startTime} - ${appointment.endTime}`;

        // Fix 4: Wrap in transaction so reminderSent is only set if
        // notification creation succeeds — prevents duplicate reminders
        // on the next cron run if the notification step threw an error.
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
           this.logger.log(
  `Reminder sent for appointment ${appointment.id} to patient ${patient.id}`,
);

          await this.notificationService.createNotification(
    patient.id,
    title,
    message,
    NotificationType.APPOINTMENT_REMINDER,
    queryRunner.manager,
);

           appointment.reminderSent = true;

await queryRunner.manager.save(appointment);
          await queryRunner.commitTransaction();
        } catch (error:any) {
          await queryRunner.rollbackTransaction();
          this.logger.error(
            `Failed to send reminder for appointment ${appointment.id}: ${error.message}`,
            error.stack,
          );
        } finally {
          await queryRunner.release();
        }
      }
    }
  }
  @Cron('0 0 9 * * *')
async handleDailyReminder() {
  this.logger.log('Checking daily appointment reminders...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  const appointments = await this.appointmentRepository
    .createQueryBuilder('appointment')
    .leftJoinAndSelect('appointment.doctor', 'doctor')
    .leftJoinAndSelect('appointment.patient', 'patient')
    .where('appointment.status = :status', {
      status: AppointmentStatus.BOOKED,
    })
    .andWhere('appointment.dailyReminderSent = :sent', {
      sent: false,
    })
    .andWhere('appointment.appointmentDate = :date', {
      date: tomorrowDate,
    })
    .getMany();

  for (const appointment of appointments) {
    const doctor = appointment.doctor;
    const patient = appointment.patient;

    if (!doctor || !patient) {
      this.logger.warn(
        `Skipping appointment ${appointment.id}: missing doctor/patient`,
      );
      continue;
    }

    const title = 'Appointment Reminder';

    const message =
      doctor.schedulingType?.toUpperCase() === 'WAVE'
        ? `Appointment Reminder

Doctor: Dr. ${doctor.fullName}
Reporting Time: ${appointment.startTime}
Token Number: ${appointment.tokenNumber}`

        : `Appointment Reminder

Doctor: Dr. ${doctor.fullName}
Date: ${appointment.appointmentDate}
Time: ${appointment.startTime} - ${appointment.endTime}`;

    const queryRunner = this.dataSource.createQueryRunner();

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

      appointment.dailyReminderSent = true;

      await queryRunner.manager.save(appointment);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Daily reminder sent for appointment ${appointment.id}`,
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
}