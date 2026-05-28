import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { Meetings } from '../entities/meeting.entity';
import { CreateMeetingDto } from '../dto/create-meeting.dto';
import { RescheduleMeetingDto } from '../dto/reschedule-meeting.dto';
import { GoogleMeetService } from './google-meet.service';
import { MeetingStatus } from '../entities/meetingStatus.entity';

import { Users } from 'src/users/entities/user.entity';
import { TrainingRequests } from 'src/training-requests/entities/training-request.entity';
import { RequestStatus } from 'src/training-requests/enums/requests-status.enum';

import { NotificationsGateway } from 'src/notifications/gateways/notifications.gateway';

// Convierte una fecha y hora local (en el timezone dado) a UTC
function localToUTC(date: string, time: string, timezone: string): Date {
  const localString = `${date}T${time}:00`;
  const localDate = new Date(localString);
  const tzDate = new Date(
    new Date(localString).toLocaleString('en-US', { timeZone: timezone }),
  );
  const offsetMs = localDate.getTime() - tzDate.getTime();
  return new Date(localDate.getTime() + offsetMs);
}

// Obtiene hora y minutos locales en el timezone dado
function getLocalHour(
  date: Date,
  timezone: string,
): { hour: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  return {
    hour: parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0'),
    minutes: parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0'),
  };
}

// Obtiene el día de la semana local en el timezone dado (0=domingo, 6=sábado)
function getLocalDay(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    weekday: 'short',
  });
  const weekday = formatter.format(date);
  const days: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return days[weekday] ?? date.getDay();
}

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meetings)
    private readonly meetingRepository: Repository<Meetings>,

    @InjectRepository(TrainingRequests)
    private readonly trainingRequestRepository: Repository<TrainingRequests>,

    private readonly googleMeetService: GoogleMeetService,

    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,

    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(dto: CreateMeetingDto) {
    const timezone = dto.timezone ?? 'America/Bogota';

    const trainingRequest = await this.trainingRequestRepository.findOne({
      where: { id: dto.trainingRequestId },
      relations: ['user', 'training'],
    });

    if (!trainingRequest) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const start = localToUTC(dto.date, dto.time, timezone);
    const now = new Date();

    const selectedDate = new Date(start);
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      throw new BadRequestException(
        'No puedes agendar reuniones en fechas pasadas',
      );
    }

    const request = await this.trainingRequestRepository.findOne({
      where: { id: dto.trainingRequestId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const user = await this.usersRepository.findOne({
      where: { id: request.user.id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const minAllowedDate = new Date(now.getTime() + 30 * 60000);

    if (start <= minAllowedDate) {
      throw new BadRequestException(
        'La reunión debe agendarse con al menos 30 minutos de anticipación',
      );
    }

    const day = getLocalDay(start, timezone);

    if (day === 0 || day === 6) {
      throw new BadRequestException(
        'No se permiten reuniones los fines de semana',
      );
    }

    const { hour, minutes } = getLocalHour(start, timezone);

    const invalidHour = hour < 9 || hour > 16 || (hour === 16 && minutes > 30);

    if (invalidHour) {
      throw new BadRequestException(
        'La reunión está fuera del horario laboral (9:00 - 16:30)',
      );
    }

    const validMinutes = minutes === 0 || minutes === 30;

    if (!validMinutes) {
      throw new BadRequestException(
        'Solo se permiten intervalos de 30 minutos',
      );
    }

    const exists = await this.meetingRepository.findOne({
      where: {
        startTime: start,
        status: Not(MeetingStatus.CANCELLED),
      },
    });

    if (exists) {
      throw new BadRequestException('Este horario ya está ocupado');
    }

    const end = new Date(start.getTime() + 30 * 60000);

    const googleData = await this.googleMeetService.createEvent({
      start,
      end,
      email: trainingRequest.user.email,
      name: trainingRequest.user.name,
    });

    const meeting = this.meetingRepository.create({
      user: { id: request.user.id },
      trainingRequest: { id: dto.trainingRequestId },
      topic:
        dto.topic || trainingRequest.training?.title || 'Reunión programada',
      startTime: start,
      endTime: end,
      meetLink: googleData.meetLink,
      googleEventId: googleData.googleEventId,
      status: MeetingStatus.CONFIRMED,
      reminderSent: false,
    });

    request.status = RequestStatus.SCHEDULED;
    await this.trainingRequestRepository.save(request);

    this.notificationsGateway.emitNotificationToAdmin({
      type: 'request_scheduled',
      title: 'Nueva actualización de solicitud',
      message: `La solicitud cambió a "scheduled"`,
      status: RequestStatus.SCHEDULED,
      requestId: dto.trainingRequestId,
    });

    return await this.meetingRepository.save(meeting);
  }

  async findAll() {
    return this.meetingRepository.find({
      relations: ['user', 'trainingRequest'],
      order: { startTime: 'ASC' },
    });
  }

  async findOne(id: string) {
    const meeting = await this.meetingRepository.findOne({
      where: {
        id,
        status: Not(MeetingStatus.CANCELLED),
      },
      relations: ['user', 'trainingRequest'],
    });

    if (!meeting) {
      throw new NotFoundException('Reunión no encontrada');
    }

    return meeting;
  }

  async cancel(id: string) {
    const meeting = await this.meetingRepository.findOne({
      where: { id },
      relations: ['user', 'trainingRequest'],
    });

    if (!meeting) {
      throw new NotFoundException('Reunión no encontrada');
    }

    if (meeting.googleEventId) {
      await this.googleMeetService.deleteEvent(meeting.googleEventId);
    }

    meeting.status = MeetingStatus.CANCELLED;

    if (meeting.trainingRequest?.id && meeting.user?.id) {
      this.notificationsGateway.emitNotificationToUser(meeting.user.id, {
        type: 'meeting_cancelled',
        requestId: meeting.trainingRequest.id,
      });
    }

    return await this.meetingRepository.save(meeting);
  }

  async reschedule(id: string, dto: RescheduleMeetingDto) {
    const timezone = dto.timezone ?? 'America/Bogota';

    const meeting = await this.meetingRepository.findOne({
      where: { id },
      relations: ['user', 'trainingRequest'],
    });

    if (!meeting) {
      throw new NotFoundException('Reunión no encontrada');
    }

    const newStart = localToUTC(dto.date, dto.time, timezone);
    const now = new Date();

    const selectedDate = new Date(newStart);
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      throw new BadRequestException(
        'No puedes reagendar reuniones en fechas pasadas',
      );
    }

    const minAllowedDate = new Date(now.getTime() + 30 * 60000);

    if (newStart <= minAllowedDate) {
      throw new BadRequestException(
        'La reunión debe reagendarse con al menos 30 minutos de anticipación',
      );
    }

    const day = getLocalDay(newStart, timezone);

    if (day === 0 || day === 6) {
      throw new BadRequestException(
        'No se permiten reuniones los fines de semana',
      );
    }

    const { hour, minutes } = getLocalHour(newStart, timezone);

    const invalidHour = hour < 9 || hour > 16 || (hour === 16 && minutes > 30);

    if (invalidHour) {
      throw new BadRequestException(
        'La reunión está fuera del horario laboral (9:00 - 16:30)',
      );
    }

    const validMinutes = minutes === 0 || minutes === 30;

    if (!validMinutes) {
      throw new BadRequestException(
        'Solo se permiten intervalos de 30 minutos',
      );
    }

    const occupied = await this.meetingRepository.findOne({
      where: {
        startTime: newStart,
        status: Not(MeetingStatus.CANCELLED),
        id: Not(id),
      },
    });

    if (occupied) {
      throw new BadRequestException('Este horario ya está ocupado');
    }

    const newEnd = new Date(newStart.getTime() + 30 * 60000);

    if (meeting.googleEventId) {
      await this.googleMeetService.updateEvent(
        meeting.googleEventId,
        newStart,
        newEnd,
      );
    }

    meeting.startTime = newStart;
    meeting.endTime = newEnd;
    meeting.status = MeetingStatus.CONFIRMED;

    return await this.meetingRepository.save(meeting);
  }
}
