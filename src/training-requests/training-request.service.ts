import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTrainingRequestDto } from './dto/create-training-request.dto';
import { UpdateTrainingRequestDto } from './dto/update-training-request.dto';
import { TrainingRequestRepository } from './repositories/training-request.repository';
import { TrainingRequests } from './entities/training-request.entity';

@Injectable()
export class TrainingRequestService {
  constructor(
    private readonly repository: TrainingRequestRepository) { }

  async create(
    createTrainingRequestDto: CreateTrainingRequestDto,
    userId: string
  ): Promise<TrainingRequests> {
    const requestData = {
      ...createTrainingRequestDto,
      user: { id: userId },
    };
    return await this.repository.createRequests(requestData);;
  }

  async findAll(): Promise<TrainingRequests[]> {
    return await this.repository.findAllRequests();
  }

  async findOne(id: string): Promise<TrainingRequests> {
    return await this.repository.findRequestById(
      id,
    );
  }

  async update(
    id: string,
    updateTrainingRequestDto: UpdateTrainingRequestDto,
  ): Promise<TrainingRequests> {
    return await this.repository.updateRequest(
      id,
      updateTrainingRequestDto,
    );
  }
}
