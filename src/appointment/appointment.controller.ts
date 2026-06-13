import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';

import { AppointmentService } from './appointment.service';

@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
  ) {}

  @Post()
  createAppointment(@Body() body: any) {
    return this.appointmentService.createAppointment(
      body,
    );
  }
}