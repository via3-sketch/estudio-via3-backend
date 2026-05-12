import { Module } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meetings } from './entities/meeting.entity';

@Module({
  controllers: [MeetingsController],
  providers: [MeetingsService],
  imports: [TypeOrmModule.forFeature([Meetings])]
})
export class MeetingsModule {}
