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
@Get('appointments')

getDoctorAppointments(

@Query('doctorId')
doctorId:string,

@Query('date')
date?:string,

){

return this.doctorService.getDoctorAppointments(

Number(doctorId),

date,

);

}
@Patch(
'appointments/:id/cancel',
)

cancelDoctorAppointment(

@Param('id')
id:string,

@Query('doctorId')
doctorId:string,

){

return this.doctorService.cancelDoctorAppointment(

Number(doctorId),

Number(id),

);

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
@Patch(':id/scheduling-type')
updateSchedulingType(
  @Param('id') id: string,
  @Body() body: any,
) {
  return this.doctorService.updateSchedulingType(
    Number(id),
    body,
  );
}
@Get(':doctorId/wave')
getWaveAvailability(
  @Param('doctorId')
  doctorId: string,
  @Query('date')
  date: string,
) {
  return this.doctorService.getWaveAvailability(
    Number(doctorId),
    date,
  );
}
@Get(':id')
  getDoctorById(@Param('id') id: string) {
    return this.doctorService.getDoctorById(Number(id));
  }
}