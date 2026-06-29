import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { ManyToOne, JoinColumn } from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';
import { Patient } from '../patient/patient.entity';
export enum AppointmentStatus {
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  doctorId!: number;

  @Column()
  patientId!: number;

  @Column()
  appointmentDate!: string;

  @Column()
  startTime!: string;

  @Column()
  endTime!: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.BOOKED,
  })
  status!: AppointmentStatus;
  
  @Column({
default:false
})
reminderSent!:boolean;
@Column({
  nullable: true,
})
tokenNumber!: number;
@ManyToOne(() => Doctor)
@JoinColumn({ name: 'doctorId' })
doctor!: Doctor;

@ManyToOne(() => Patient)
@JoinColumn({ name: 'patientId' })
patient!: Patient;
}