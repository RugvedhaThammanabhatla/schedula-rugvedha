import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';

import { DoctorLeaveService } from './doctor-leave.service';
import { CreateDoctorLeaveDto } from './dto/create-doctor-leave.dto';
import { UpdateDoctorLeaveDto } from './dto/update-doctor-leave.dto';

@Controller('doctor-leave')
export class DoctorLeaveController {
  constructor(
    private readonly doctorLeaveService: DoctorLeaveService,
  ) {}

  @Post(':doctorId')
  create(
    @Param('doctorId') doctorId: number,
    @Body() dto: CreateDoctorLeaveDto,
  ) {
    return this.doctorLeaveService.create(
      Number(doctorId),
      dto,
    );
  }

  @Get(':doctorId')
  findAll(
    @Param('doctorId') doctorId: number,
  ) {
    return this.doctorLeaveService.findAll(
      Number(doctorId),
    );
  }

  @Patch(':doctorId/:id')
  update(
    @Param('doctorId') doctorId: number,
    @Param('id') id: number,
    @Body() dto: UpdateDoctorLeaveDto,
  ) {
    return this.doctorLeaveService.update(
      Number(id),
      Number(doctorId),
      dto,
    );
  }

  @Delete(':doctorId/:id')
  remove(
    @Param('doctorId') doctorId: number,
    @Param('id') id: number,
  ) {
    return this.doctorLeaveService.remove(
      Number(id),
      Number(doctorId),
    );
  }
}