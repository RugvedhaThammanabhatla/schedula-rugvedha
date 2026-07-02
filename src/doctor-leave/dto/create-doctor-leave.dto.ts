import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDoctorLeaveDto {
  @IsDateString()
  leaveDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}