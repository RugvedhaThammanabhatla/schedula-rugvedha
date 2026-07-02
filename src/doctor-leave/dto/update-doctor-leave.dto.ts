import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateDoctorLeaveDto {
  @IsOptional()
  @IsDateString()
  leaveDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}