import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

export enum AppointmentStatus {
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  doctorId: number;

  @Column()
  patientId: number;

  @Column()
  appointmentDate: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.BOOKED,
  })
  status: AppointmentStatus;
  @Column({
default:false
})
reminderSent!:boolean;
@Column({
  nullable: true,
})
tokenNumber!: number;
}