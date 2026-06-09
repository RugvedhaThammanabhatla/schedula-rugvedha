import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  ForbiddenException,
} from '@nestjs/common';

@Controller('patient')
export class PatientController {
  private patientProfile = {};

  @Post('profile')
  createProfile(@Query('role') role: string, @Body() body: any) {
    if (role !== 'PATIENT') {
      throw new ForbiddenException('Only patients can create profile');
    }

    this.patientProfile = body;

    return {
      message: 'Patient profile created',
      data: this.patientProfile,
    };
  }

  @Get('profile')
  getProfile(@Query('role') role: string) {
    if (role !== 'PATIENT') {
      throw new ForbiddenException('Only patients can access profile');
    }

    return this.patientProfile;
  }

  @Patch('profile')
  updateProfile(@Query('role') role: string, @Body() body: any) {
    if (role !== 'PATIENT') {
      throw new ForbiddenException('Only patients can update profile');
    }

    this.patientProfile = {
      ...this.patientProfile,
      ...body,
    };

    return {
      message: 'Patient profile updated',
      data: this.patientProfile,
    };
  }
}