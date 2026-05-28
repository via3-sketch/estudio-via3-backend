import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Meetings } from '../entities/meeting.entity';
import { WORKING_DAYS } from '../utils/meeting.constants';
import { generateDaySlots } from '../utils/slot.utils';
import { MeetingStatus } from '../entities/meetingStatus.entity';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Meetings)
    private readonly meetingRepository: Repository<Meetings>,
  ) {}

  async getAvailability(date: string, timezone: string) {
    const targetDate = new Date(`${date}T12:00:00.000Z`);

    const todayInTz = new Date(
      new Date().toLocaleString('en-CA', { timeZone: timezone }),
    );
    todayInTz.setHours(0, 0, 0, 0);

    const selectedInTz = new Date(
      new Date(`${date}T00:00:00`).toLocaleString('en-CA', {
        timeZone: timezone,
      }),
    );
    selectedInTz.setHours(0, 0, 0, 0);

    if (selectedInTz < todayInTz) {
      return [];
    }

    const dayFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      weekday: 'short',
    });
    const days: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const day = days[dayFormatter.format(targetDate)] ?? targetDate.getDay();

    if (!WORKING_DAYS.includes(day)) {
      return [];
    }

    // Pasamos el timezone para generar slots en hora local
    const slots = generateDaySlots(targetDate, timezone);

    const meetings = await this.meetingRepository.find({
      where: { status: Not(MeetingStatus.CANCELLED) },
    });

    const now = new Date();
    const minAvailableTime = new Date(now.getTime() + 30 * 60000);

    return slots.filter((slot) => {
      if (slot.start <= minAvailableTime) {
        return false;
      }
      return !meetings.some(
        (meeting) =>
          new Date(meeting.startTime).getTime() === slot.start.getTime(),
      );
    });
  }
}
