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
      .innerJoinAndMapOne(
        'appointment.doctor',
        'doctors',
        'doctor',
        'doctor.id = appointment.doctorId',
      )
      .innerJoinAndMapOne(
        'appointment.patient',
        'patient',
        'patient',
        'patient.id = appointment.patientId',
      )
      .where('appointment.status = :status', {
        status: AppointmentStatus.BOOKED,
      })
      .andWhere('appointment.reminderSent = :reminderSent', {
        reminderSent: false,
      })
      .orderBy('appointment.appointmentDate', 'ASC')
      .getMany();

    for (const appointment of appointments) {
      const doctor = (appointment as any).doctor;
      const patient = (appointment as any).patient;

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
      const diffMinutes =
        (appointmentTime.getTime() - now.getTime()) / 60000;

      if (diffMinutes <= REMINDER_WINDOW && diffMinutes > 0) {
        const title = 'Appointment Reminder';

        // Fix 3: Corrected Wave message formatting (no stray newlines)
        const message =
          doctor.schedulingType?.toUpperCase() === 'WAVE'
            ? `Reminder: You have an appointment with Dr. ${doctor.fullName}. Reporting Time: ${appointment.startTime}. Token Number: ${appointment.tokenNumber}.`
            : `Reminder: You have an appointment with Dr. ${doctor.fullName} on ${appointment.appointmentDate} from ${appointment.startTime} to ${appointment.endTime}.`;

        // Fix 4: Wrap in transaction so reminderSent is only set if
        // notification creation succeeds — prevents duplicate reminders
        // on the next cron run if the notification step threw an error.
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          this.logger.log(
            `Sending reminder for appointment ${appointment.id}`,
          );

          await this.notificationService.createNotification(
            patient.id,
            title,
            message,
            NotificationType.APPOINTMENT_REMINDER,
          );

          await queryRunner.manager.update(Appointment, appointment.id, {
            reminderSent: true,
          });

          await queryRunner.commitTransaction();
        } catch (error) {
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
}