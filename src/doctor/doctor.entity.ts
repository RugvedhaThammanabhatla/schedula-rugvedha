import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fullName!: string;

  @Column()
  specialization!: string;

  @Column()
  experience!: number;

  @Column()
  consultationFee!: number;

  @Column()
  availability!: boolean;

  @Column({
    default: 'STREAM',
  })
  schedulingType!: string;

  @Column({
    nullable: true,
  })
  slotDuration!: number;

  @Column({
    default: 0,
  })
  bufferTime!: number;

  @Column({
    nullable: true,
  })
  maxCapacity!: number;
}