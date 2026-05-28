import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  Cron,
} from '@nestjs/schedule';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Not,
  Repository,
} from 'typeorm';

import { Meetings } from '../entities/meeting.entity';

import { EmailService } from 'src/notifications/channels/email/email.service';

import { MeetingStatus } from '../entities/meetingStatus.entity';

@Injectable()
export class MeetingRemindersService {

  private readonly logger =
    new Logger(
      MeetingRemindersService.name,
    );

  constructor(

    @InjectRepository(Meetings)
    private readonly meetingsRepository:
      Repository<Meetings>,

    private readonly emailService:
      EmailService,
  ) {}

  @Cron('*/10 * * * *')
  async sendReminders() {

    this.logger.log(
      'Chequeando recordatorios de reuniones...',
    );

    await this.checkReminders24h();

    await this.checkReminders2h();
  }

  async checkReminders24h() {

    const now =
      new Date();

    const from =
      new Date(
        now.getTime() +
        23 * 60 * 60 * 1000,
      );

    const to =
      new Date(
        now.getTime() +
        25 * 60 * 60 * 1000,
      );

    const meetings =
      await this.meetingsRepository.find({
        where: {
          reminder24hSent:
            false,

          status:
            Not(
              MeetingStatus.CANCELLED,
            ),
        },

        relations: [
          'user',
          'trainingRequest',
        ],
      });

    for (const meeting of meetings) {

      const meetingDateTime =
        this.getMeetingDateTime(
          meeting,
        );

      if (
        meetingDateTime >= from &&
        meetingDateTime <= to
      ) {

        const email =
          meeting.user?.email;

        const userName =
          meeting.user?.companyName ||
          meeting.user?.name ||
          'Cliente';

        if (email) {

          const formattedData =
            this.formatMeetingData(
              meeting.startTime,
            );

          await this.emailService.sendMeetingReminder24h(
            email,

            {
              name:
                userName,

              day:
                formattedData.day,

              date:
                formattedData.date,

              time:
                formattedData.time,

              meetLink:
                meeting.meetLink,

              year:
                formattedData.year,
            },
          );

          await this.meetingsRepository.update(
            meeting.id,
            {
              reminder24hSent:
                true,
            },
          );

          this.logger.log(
            `Recordatorio 24h enviado a ${email}`,
          );
        }
      }
    }
  }

  private async checkReminders2h() {

    const now =
      new Date();

    const from =
      new Date(
        now.getTime() +
        1 * 60 * 60 * 1000,
      );

    const to =
      new Date(
        now.getTime() +
        3 * 60 * 60 * 1000,
      );

    const meetings =
      await this.meetingsRepository.find({
        where: {
          reminder2hSent:
            false,

          status:
            Not(
              MeetingStatus.CANCELLED,
            ),
        },

        relations: [
          'user',
          'trainingRequest',
        ],
      });

    for (const meeting of meetings) {

      const meetingDateTime =
        this.getMeetingDateTime(
          meeting,
        );

      if (
        meetingDateTime >= from &&
        meetingDateTime <= to
      ) {

        const email =
          meeting.user?.email;

        const userName =
          meeting.user?.companyName ||
          meeting.user?.name ||
          'Cliente';

        if (email) {

          const formattedData =
            this.formatMeetingData(
              meeting.startTime,
            );

          await this.emailService.sendMeetingReminder2h(
            email,

            {
              name:
                userName,

              day:
                formattedData.day,

              date:
                formattedData.date,

              time:
                formattedData.time,

              meetLink:
                meeting.meetLink,

              year:
                formattedData.year,
            },
          );

          await this.meetingsRepository.update(
            meeting.id,
            {
              reminder2hSent:
                true,
            },
          );

          this.logger.log(
            `Recordatorio 2h enviado a ${email}`,
          );
        }
      }
    }
  }

  private formatMeetingData(
    meetingDate: Date,
  ) {

    const timezone =
      'America/Argentina/Buenos_Aires';

    const day =
      meetingDate.toLocaleDateString(
        'es-AR',
        {
          weekday:
            'long',

          timeZone:
            timezone,
        },
      );

    const date =
      meetingDate.toLocaleDateString(
        'es-AR',
        {
          year:
            'numeric',

          month:
            'long',

          day:
            'numeric',

          timeZone:
            timezone,
        },
      );

    const time =
      meetingDate.toLocaleTimeString(
        'es-AR',
        {
          hour:
            '2-digit',

          minute:
            '2-digit',

          hour12:
            true,

          timeZone:
            timezone,
        },
      );

    const year =
      new Date()
        .getFullYear();

    return {
      day,
      date,
      time,
      year,
    };
  }

  private getMeetingDateTime(
    meeting: Meetings,
  ): Date {

    return new Date(
      meeting.startTime,
    );
  }

  @Cron('*/5 * * * *')
  async handleCron() {

    this.logger.log(
      'Checking reminders...',
    );
  }
}