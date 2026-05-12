import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TrainingRequests } from '../entities/training-request.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTrainingRequestDto } from '../dto/create-training-request.dto';
import { UpdateTrainingRequestDto } from '../dto/update-training-request.dto';

@Injectable()
export class TrainingRequestRepository {
  constructor(
    @InjectRepository(TrainingRequests)
    private readonly repository: Repository<TrainingRequests>,
  ) { }

  async createRequests(data: CreateTrainingRequestDto): Promise<TrainingRequests> {
    const newRequest = this.repository.create(data);

    return await this.repository.save(newRequest);
  }

  async findAllRequests(): Promise<TrainingRequests[]> {
    return await this.repository.find({
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      }
    })
  }

  async findRequestById(id: string): Promise<TrainingRequests> {
    return await this.repository.findOneOrFail({
      where: { id },
      relations: ['user'],
    });
  }

  async updateRequest(
    id: string,
    data: UpdateTrainingRequestDto,
  ): Promise<TrainingRequests> {
    await this.repository.update(id, data);
    return await this.repository.findOneOrFail({
      where: { id },
      relations: ['user'],
    });
  }
}
