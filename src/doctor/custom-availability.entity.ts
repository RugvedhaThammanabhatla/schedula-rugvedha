import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CustomAvailability {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  doctorId!: number;

  @Column()
  date!: string;

  @Column()
  startTime!: string;

  @Column()
  endTime!: string;

  @Column({
  default: true,
})
allowFutureBooking!: boolean;
}