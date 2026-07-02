import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';
import { AppointmentModule } from './appointment/appointment.module';

import { User } from './auth/user.entity';
import { Doctor } from './doctor/doctor.entity';
import { Patient } from './patient/patient.entity';
import { Appointment } from './appointment/appointment.entity';
import { NotificationModule } from './notification/notification.module';
import { DoctorLeaveModule } from './doctor-leave/doctor-leave.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        User,
        Doctor,
        Patient,
        Appointment,
      ],
      synchronize: true,
      autoLoadEntities: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),

    AuthModule,
    DoctorModule,
    PatientModule,
    AppointmentModule,
    NotificationModule,
    DoctorLeaveModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}