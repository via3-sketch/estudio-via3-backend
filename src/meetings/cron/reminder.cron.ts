import { Injectable, Logger } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Meetings } from '../entities/meeting.entity';

import { EmailService } from 'src/notifications/channels/email/email.service';

@Injectable()
export class MeetingRemindersService {
  private readonly logger = new Logger(MeetingRemindersService.name);

  constructor(
    @InjectRepository(Meetings)
    private readonly meetingsRepository: Repository<Meetings>,

    private readonly emailService: EmailService,
  ) {}

  @Cron('*/10 * * * *')
  async sendReminders() {
    this.logger.log('Chequeando recordatorios de reuniones...');

    await this.checkReminders24h();

    await this.checkReminders2h();
  }

  async checkReminders24h() {
    const now = new Date();

    const from = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const meetings = await this.meetingsRepository.find({
      where: {
        reminder24hSent: false,
      },

      relations: ['user', 'trainingRequest'],
    });

    for (const meeting of meetings) {
      const meetingDateTime = this.getMeetingDateTime(meeting);

      if (meetingDateTime >= from && meetingDateTime <= to) {
        const email = meeting.user?.email;

        const companyName =
          meeting.user?.companyName || meeting.user?.name || 'Cliente';

        const startTime = meeting.startTime as Date;

        if (email) {
          await this.emailService.sendMeetingReminder24h(
            email,

            companyName,

            String(meeting.startTime),

            meeting.startTime.toISOString().split('T')[1],

            meeting.meetLink,
          );

          await this.meetingsRepository.update(meeting.id, {
            reminder24hSent: true,
          });

          this.logger.log(`Recordatorio 24h enviado a ${email}`);
        }
      }
    }
  }

  private async checkReminders2h() {
    const now = new Date();

    const from = new Date(now.getTime() + 1 * 60 * 60 * 1000);

    const to = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const meetings = await this.meetingsRepository.find({
      where: {
        reminder2hSent: false,
      },

      relations: ['user', 'trainingRequest'],
    });

    for (const meeting of meetings) {
      const meetingDateTime = this.getMeetingDateTime(meeting);

      if (meetingDateTime >= from && meetingDateTime <= to) {
        const email = meeting.user?.email;

        const companyName =
          meeting.user?.companyName || meeting.user?.name || 'Cliente';

        const startTime = new Date(meeting.startTime);

        if (email) {
          await this.emailService.sendMeetingReminder2h(
            email,

            companyName,

            String(meeting.startTime),

            meeting.startTime.toISOString().split('T')[1],

            meeting.meetLink,
          );

          await this.meetingsRepository.update(meeting.id, {
            reminder2hSent: true,
          });

          this.logger.log(`Recordatorio 2h enviado a ${email}`);
        }
      }
    }
  }

  private getMeetingDateTime(meeting: Meetings): Date {
    const [hours, minutes] = meeting.startTime
      .toISOString()
      .split('T')[1]
      .split(':')
      .map(Number);

    const dateStr = String(meeting.startTime.toISOString().split('T')[0]);

    const [year, month, day] = dateStr.split('-').map(Number);

    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

    return date;
  }

  @Cron('*/5 * * * *')
  async handleCron() {
    console.log('Checking reminders...');
  }
}
