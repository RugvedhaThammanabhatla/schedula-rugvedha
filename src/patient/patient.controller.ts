import { Controller, Get, Query, ForbiddenException } from '@nestjs/common';

@Controller('patient')
export class PatientController {

  @Get('profile')
  getProfile(@Query('role') role: string) {

    if (role !== 'PATIENT') {
      throw new ForbiddenException('Only patients can access');
    }

    return {
      message: 'Patient Profile Accessed'
    };
  }
}