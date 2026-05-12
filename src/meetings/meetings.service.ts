import { ConflictException, Injectable } from '@nestjs/common';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Meetings } from './entities/meeting.entity';
import { Repository } from 'typeorm';
import { NotFoundError } from 'rxjs';
import { MeetingStatus } from './entities/meetingStatus.entity';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meetings)
    private readonly meetingsRepository: Repository<Meetings>
  ) {}

  horarios = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00']

  async create(createMeetingDto: CreateMeetingDto) {
    this.validarFechaYHora(createMeetingDto)
    const newMeetingData = {...createMeetingDto, link: 'https://meet.google.com/geq-wgxn-gsz'}
    return await this.meetingsRepository.insert(newMeetingData);
  }

  async findAll() {
    return await this.meetingsRepository.find();
  }

  async findOne(id: string) {
    const meetingFound = await this.meetingsRepository.findOneBy({id: id})
    if(!meetingFound) throw new NotFoundError(`La reunion con id: ${id} no existe`)
    return meetingFound;
  }

  async update(id: string, updateMeetingDto: UpdateMeetingDto) {
    return await this.meetingsRepository.update({id: id}, updateMeetingDto);
  }

  async cancel(id: string) {
    const meeting: Meetings = await this.findOne(id)
    meeting.status = MeetingStatus.Cancelada
    return await this.meetingsRepository.update({id: id}, meeting);
  }

  async validarFechaYHora(createMeetingDto: CreateMeetingDto) {
    const meetings = await this.meetingsRepository.findBy({date: createMeetingDto.date})
    if(meetings.some( meeting => meeting.time === createMeetingDto.time)) return new ConflictException(`Ya existe una reunion en este horario`)
  }

  async findDisponibilidad(fecha: Date) {
    const meetings = await this.meetingsRepository.findBy({date: fecha})
    const newHorarios = this.horarios.filter(meeting => meetings.some(m => m.time == meeting))
    return newHorarios
  }
}
