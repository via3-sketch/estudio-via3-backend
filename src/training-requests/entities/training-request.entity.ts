import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Expose } from 'class-transformer';
import { Users } from '../../users/entities/user.entity';
import { RequestStatus } from '../enums/requests-status.enum';
//import { Trainings } from './training.entity';

@Entity({
  name: 'TRAINING_REQUESTS',
})
export class TrainingRequests {
  @Expose({ groups: ['Get'] })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Expose({ groups: ['Get'] })
  @Column({ type: 'int' })
  participantsCount!: number;

  @Expose({ groups: ['Get'] })
  @Column({ type: 'text', nullable: false })
  objectives!: string;

  @Expose({ groups: ['Get'] })
  @Column({ type: 'text', nullable: false })
  context!: string;

  @Expose({ groups: ['Get'] })
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING
  })
  status!: RequestStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Users)
  user!: Users;

  /*@ManyToOne(() => Trainings, (training) => training.requests)
  training!: Trainings;*/


}