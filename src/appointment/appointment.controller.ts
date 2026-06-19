import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
} from '@nestjs/common';

import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './appointment.dto';

@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
  ) {}

  @Post()
  createAppointment(
    @Body() body: CreateAppointmentDto,
  ) {
    return this.appointmentService.createAppointment(
      body,
    );
  }

  @Get('my')
  getMyAppointments(
    @Query('patientId') patientId: string,
  ) {
    return this.appointmentService.getMyAppointments(
      Number(patientId),
    );
  }

  @Patch(':id/cancel')
  cancelAppointment(
    @Param('id') id: string,
    @Query('patientId') patientId: string,
  ) {
    return this.appointmentService.cancelAppointment(
      Number(id),
      Number(patientId),
    );
  }

  @Get('doctor')
  getDoctorAppointments(
    @Query('doctorId') doctorId: string,
  ) {
    return this.appointmentService.getDoctorAppointments(
      Number(doctorId),
    );
  }
  @Patch(':id/reschedule')
rescheduleAppointment(
  @Param('id') id: string,
  @Body() body: any,
) {
  return this.appointmentService
    .rescheduleAppointment(
      Number(id),
      body.patientId,
      body,
    );
}
}