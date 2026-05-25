import { TrainingRequests } from 'src/training-requests/entities/training-request.entity';

import {
  Column,
  JoinColumn,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { MeetingStatus } from './meetingStatus.entity';

import { Users } from 'src/users/entities/user.entity';

@Entity('MEETINGS')
export class Meetings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    default: 'Scheduled Meeting',
  })
  topic!: string;

  @Column({
    type: 'timestamp',
  })
  startTime!: Date;

  @Column({
    type: 'timestamp',
  })
  endTime!: Date;

  @Column({
    nullable: true,
  })
  meetLink!: string;

  @Column({
    nullable: true,
  })
  googleEventId!: string;

  @Column({
    type: 'enum',
    enum: MeetingStatus,
    enumName: 'meeting_status_enum',
    default: MeetingStatus.PENDING,
  })
  status!: MeetingStatus;

  @Column({
    default: false,
  })
  reminderSent!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Users, (user) => user.meetings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'userId',
  })
  user!: Users;

  @ManyToOne(
    () => TrainingRequests,
    (trainingRequest) => trainingRequest.meetings,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'trainingRequestId',
  })
  trainingRequest!: TrainingRequests;

  @Column({
    type: 'boolean',
    default: false,
  })
  reminder24hSent!: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  reminder2hSent!: boolean;
}
