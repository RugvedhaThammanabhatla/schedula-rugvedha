import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';

import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './appointment.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
  ) {}


  // ======================
  // Book Appointment
  // ======================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PATIENT')
  @Post()
  createAppointment(
    @Req() req: any,
    @Body() body: CreateAppointmentDto,
  ) {
console.log(req.user);
    body.patientId = req.user.userId;

    return this.appointmentService.createAppointment(
      body,
    );
  }


  // ======================
  // My Appointments
  // ======================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PATIENT')
  @Get('my')
  getMyAppointments(
    @Req() req: any,
  ) {

    return this.appointmentService.getMyAppointments(
      req.user.userId,
    );

  }


  // ======================
  // Cancel Appointment
  // ======================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PATIENT')
  @Patch(':id/cancel')
  cancelAppointment(

    @Param('id')
    id: string,

    @Req()
    req: any,

  ) {

    return this.appointmentService.cancelAppointment(

      Number(id),

      req.user.userId,

    );

  }


  // ======================
  // Doctor Appointments
  // ======================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCTOR')
  @Get('doctor')
  getDoctorAppointments(

    @Req()
    req: any,

  ) {

    return this.appointmentService.getDoctorAppointments(

      req.user.userId,

    );

  }


  // ======================
  // Reschedule Appointment
  // ======================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PATIENT')
  @Patch(':id/reschedule')
  rescheduleAppointment(

    @Param('id')
    id: string,

    @Req()
    req: any,

    @Body()
    body: any,

  ) {

    return this.appointmentService.rescheduleAppointment(

      Number(id),

      req.user.userId,

      body,

    );

  }

}