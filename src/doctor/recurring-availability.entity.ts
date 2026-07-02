import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class RecurringAvailability {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  doctorId!: number;

  @Column()
  dayOfWeek!: string;

  @Column()
  startTime!: string;

  @Column()
  endTime!: string;

  @Column({
  default: false,
})
allowFutureBooking!: boolean;

@Column({
  nullable: true,
})
maxFutureBookingDays!: number;
}