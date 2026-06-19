import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column()
  specialization!: string;

  @Column()
  experience!: number;

  @Column({ name: 'consultation_fee' })
  consultationFee!: number;

  @Column()
  availability!: boolean;
}