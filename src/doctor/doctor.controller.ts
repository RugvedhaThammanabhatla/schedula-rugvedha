import { Controller, Get, Query, ForbiddenException } from '@nestjs/common';

@Controller('doctor')
export class DoctorController {

  @Get('profile')
  getProfile(@Query('role') role: string) {

    if (role !== 'DOCTOR') {
      throw new ForbiddenException('Only doctors can access');
    }

    return {
      message: 'Doctor Profile Accessed'
    };
  }
}