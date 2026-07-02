import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DoctorLeaveController } from './doctor-leave.controller';
import { DoctorLeaveService } from './doctor-leave.service';
import { DoctorLeave } from './doctor-leave.entity';
import { Appointment } from '../appointment/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DoctorLeave,
      Appointment,
    ]),
  ],
  controllers: [
    DoctorLeaveController,
  ],
  providers: [
    DoctorLeaveService,
  ],
  exports: [
    DoctorLeaveService,
    TypeOrmModule,
  ],
})
export class DoctorLeaveModule {}