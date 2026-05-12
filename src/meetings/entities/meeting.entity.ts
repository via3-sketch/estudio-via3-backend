import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import {MeetingStatus} from './meetingStatus.entity'
import { Users } from "src/users/entities/user.entity";

@Entity({ name: "MEETINGS"})
export class Meetings {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({
        type: 'date',
        nullable: false
    })
    date!: Date

    @Column({
        type: 'varchar'
    })
    time!: string

    @Column({
        type: 'varchar'
    })
    link!: string

    @Column({
        type: 'enum',
        enum: MeetingStatus,
        enumName: 'MeetingStatus',
        default: MeetingStatus.Pendiente
    })
    status!: MeetingStatus

    @ManyToOne(() => Users)
    user!: Users
    
    // @Column({
    //     type: 'uuid'
    // })
    // organizerUserId!: string

    @CreateDateColumn()
    createdAt!: Date

    @UpdateDateColumn()
    updatedAt!: Date
}
