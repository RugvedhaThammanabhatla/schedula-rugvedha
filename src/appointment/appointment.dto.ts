import {
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsNumber()
  doctorId: number;

  @IsNumber()
  patientId: number;

  @IsString()
  appointmentDate: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}