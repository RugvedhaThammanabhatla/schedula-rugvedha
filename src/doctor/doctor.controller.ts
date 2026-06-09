import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  ForbiddenException,
} from '@nestjs/common';

@Controller('doctor')
export class DoctorController {
  private doctorProfile = {};

  @Post('profile')
  createProfile(@Query('role') role: string, @Body() body: any) {
    if (role !== 'DOCTOR') {
      throw new ForbiddenException('Only doctors can create profile');
    }

    this.doctorProfile = body;

    return {
      message: 'Doctor profile created',
      data: this.doctorProfile,
    };
  }

  @Get('profile')
  getProfile(@Query('role') role: string) {
    if (role !== 'DOCTOR') {
      throw new ForbiddenException('Only doctors can access profile');
    }

    return this.doctorProfile;
  }

  @Patch('profile')
  updateProfile(@Query('role') role: string, @Body() body: any) {
    if (role !== 'DOCTOR') {
      throw new ForbiddenException('Only doctors can update profile');
    }

    this.doctorProfile = {
      ...this.doctorProfile,
      ...body,
    };

    return {
      message: 'Doctor profile updated',
      data: this.doctorProfile,
    };
  }
}