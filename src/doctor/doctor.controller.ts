import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  getDoctors(
    @Query('specialization') specialization?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('availability') availability?: string,
  ) {
    return this.doctorService.getDoctors(
      specialization,
      search,
      page,
      limit,
      availability,
    );
  }

  @Post('availability')
  createAvailability(@Body() body: any) {
    return this.doctorService.createAvailability(body);
  }

  @Get('availability')
  getAvailability() {
    return this.doctorService.getAvailability();
  }

  @Patch('availability/:id')
  updateAvailability(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.doctorService.updateAvailability(
      Number(id),
      body,
    );
  }

  @Delete('availability/:id')
  deleteAvailability(@Param('id') id: string) {
    return this.doctorService.deleteAvailability(
      Number(id),
    );
  }

  @Post('availability/override')
  createOverride(@Body() body: any) {
    return this.doctorService.createOverride(body);
  }

  @Get('availability/date')
  getAvailabilityByDate(
    @Query('date') date: string,
  ) {
    return this.doctorService.getAvailabilityByDate(date);
  }

  @Get(':doctorId/slots')
getDoctorSlots(
  @Param('doctorId') doctorId: string,
  @Query('date') date: string,
  @Query('duration') duration?: string,
) {
  return this.doctorService.getDoctorSlots(
    Number(doctorId),
    date,
    duration,
  );
}
@Get(':id')
  getDoctorById(@Param('id') id: string) {
    return this.doctorService.getDoctorById(Number(id));
  }
}