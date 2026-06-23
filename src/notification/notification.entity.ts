import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { NotificationType } from './notification.enum';

@Entity('notifications')
export class Notification {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  title: string;

  @Column({
    type: 'text',
  })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    default: false,
  })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}