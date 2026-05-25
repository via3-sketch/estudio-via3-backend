import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Not,
  Repository,
} from 'typeorm';

import { Meetings } from '../entities/meeting.entity';

import { CreateMeetingDto } from '../dto/create-meeting.dto';

import { RescheduleMeetingDto } from '../dto/reschedule-meeting.dto';

import { GoogleMeetService } from './google-meet.service';

import { MeetingStatus } from '../entities/meetingStatus.entity';

import { Users } from 'src/users/entities/user.entity';

import { TrainingRequests } from 'src/training-requests/entities/training-request.entity';

import { RequestStatus } from 'src/training-requests/enums/requests-status.enum';

@Injectable()
export class MeetingsService {

  constructor(

    @InjectRepository(Meetings)
    private readonly meetingRepository:
    Repository<Meetings>,

    @InjectRepository(TrainingRequests)
    private readonly trainingRequestRepository:
    Repository<TrainingRequests>,

    private readonly googleMeetService:
    GoogleMeetService,

    @InjectRepository(Users)
    private readonly usersRepository:
    Repository<Users>,

    @InjectRepository(TrainingRequests)
    private readonly trainingRequestsRepository:
    Repository<TrainingRequests>,
  ) {}

  async create(
    dto: CreateMeetingDto,
  ) {

    const trainingRequest =
      await this.trainingRequestRepository.findOne({
        where: {
          id: dto.trainingRequestId,
        },

        relations: [
          'user',
          'training',
        ],
      });

    if (!trainingRequest) {

      throw new NotFoundException(
        'Training request not found',
      );
    }

    const start = new Date(
      `${dto.date}T${dto.time}:00`,
    );

    const now = new Date();

    const request =
      await this.trainingRequestsRepository.findOne(
        {
          where: {
            id: dto.trainingRequestId,
          },

          relations: ['user'],
        },
      );

    if (!request) {

      throw new NotFoundException(
        'Solicitud no encontrada',
      );
    }

    const user =
      await this.usersRepository.findOne({
        where: {
          id: request.user.id,
        },
      });

    if (!user) {

      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    const minAllowedDate =
      new Date(
        now.getTime() +
        30 * 60000,
      );

    if (start <= minAllowedDate) {

      throw new BadRequestException(
        'Meetings must be scheduled at least 30 minutes in advance',
      );
    }

    const day =
      start.getDay();

    if (day === 0 || day === 6) {

      throw new BadRequestException(
        'Weekends are not allowed',
      );
    }

    const hour =
      start.getHours();

    const minutes =
      start.getMinutes();

    const invalidHour =
      hour < 9 ||
      hour > 16 ||
      (
        hour === 16 &&
        minutes > 30
      );

    if (invalidHour) {

      throw new BadRequestException(
        'Outside business hours',
      );
    }

    const validMinutes =
      minutes === 0 ||
      minutes === 30;

    if (!validMinutes) {

      throw new BadRequestException(
        'Only 30 minute intervals are allowed',
      );
    }

    const exists =
      await this.meetingRepository.findOne({
        where: {
          startTime: start,

          status:
            Not(MeetingStatus.CANCELLED),
        },
      });

    if (exists) {

      throw new BadRequestException(
        'Slot already occupied',
      );
    }

    const end = new Date(
      start.getTime() +
      30 * 60000,
    );

    const googleData =
      await this.googleMeetService.createEvent(
        {
          start,
          end,

          email:
            trainingRequest.user.email,

          name:
            trainingRequest.user.name,
        },
      );

    const meeting =
      this.meetingRepository.create({
        user: {
          id: request.user.id,
        },

        trainingRequest: {
          id: dto.trainingRequestId,
        },

        topic:
          dto.topic ||
          trainingRequest.training?.title ||
          'Scheduled Meeting',

        startTime: start,

        endTime: end,

        meetLink:
          googleData.meetLink,

        googleEventId:
          googleData.googleEventId,

        status:
          MeetingStatus.CONFIRMED,

        reminderSent: false,
      });

    request.status =
      RequestStatus.SCHEDULED;

    await this.trainingRequestsRepository.save(
      request,
    );

    return await this.meetingRepository.save(
      meeting,
    );
  }

  async findAll() {

    return this.meetingRepository.find({
      relations: [
        'user',
        'trainingRequest',
      ],

      order: {
        startTime: 'ASC',
      },
    });
  }

  async findOne(
    id: string,
  ) {

    const meeting =
      await this.meetingRepository.findOne({
        where: { id },

        relations: [
          'user',
          'trainingRequest',
        ],
      });

    if (!meeting) {

      throw new NotFoundException(
        'Meeting not found',
      );
    }

    return meeting;
  }

  async cancel(
    id: string,
  ) {

    const meeting =
      await this.meetingRepository.findOne({
        where: { id },

        relations: [
          'user',
          'trainingRequest',
        ],
      });

    if (!meeting) {

      throw new NotFoundException(
        'Meeting not found',
      );
    }

    if (meeting.googleEventId) {

      await this.googleMeetService.deleteEvent(
        meeting.googleEventId,
      );
    }

    meeting.status =
      MeetingStatus.CANCELLED;

    return await this.meetingRepository.save(
      meeting,
    );
  }

  async reschedule(
    id: string,
    dto: RescheduleMeetingDto,
  ) {

    const meeting =
      await this.meetingRepository.findOne({
        where: { id },

        relations: [
          'user',
          'trainingRequest',
        ],
      });

    if (!meeting) {

      throw new NotFoundException(
        'Meeting not found',
      );
    }

    const newStart =
      new Date(dto.newStartTime);

    const now =
      new Date();

    const minAllowedDate =
      new Date(
        now.getTime() +
        30 * 60000,
      );

    if (
      newStart <=
      minAllowedDate
    ) {

      throw new BadRequestException(
        'Meetings must be rescheduled at least 30 minutes in advance',
      );
    }

    const day =
      newStart.getDay();

    if (day === 0 || day === 6) {

      throw new BadRequestException(
        'Weekends are not allowed',
      );
    }

    const hour =
      newStart.getHours();

    const minutes =
      newStart.getMinutes();

    const invalidHour =
      hour < 9 ||
      hour > 16 ||
      (
        hour === 16 &&
        minutes > 30
      );

    if (invalidHour) {

      throw new BadRequestException(
        'Outside business hours',
      );
    }

    const validMinutes =
      minutes === 0 ||
      minutes === 30;

    if (!validMinutes) {

      throw new BadRequestException(
        'Only 30 minute intervals are allowed',
      );
    }

    const occupied =
      await this.meetingRepository.findOne({
        where: {
          startTime: newStart,

          status:
            Not(MeetingStatus.CANCELLED),

          id: Not(id),
        },
      });

    if (occupied) {

      throw new BadRequestException(
        'Slot already occupied',
      );
    }

    const newEnd =
      new Date(
        newStart.getTime() +
        30 * 60000,
      );

    if (
      meeting.googleEventId
    ) {

      await this.googleMeetService.deleteEvent(
        meeting.googleEventId,
      );
    }

    const googleData =
      await this.googleMeetService.createEvent(
        {
          start: newStart,

          end: newEnd,

          email:
            meeting.user.email,

          name:
            meeting.user.name,
        },
      );

    meeting.startTime =
      newStart;

    meeting.endTime =
      newEnd;

    meeting.meetLink =
      googleData.meetLink;

    meeting.googleEventId =
      googleData.googleEventId;

    meeting.status =
      MeetingStatus.CONFIRMED;

    return await this.meetingRepository.save(
      meeting,
    );
  }
}