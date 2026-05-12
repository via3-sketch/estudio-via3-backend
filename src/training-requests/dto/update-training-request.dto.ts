import { PartialType } from '@nestjs/swagger';
import { CreateTrainingRequestDto } from './create-training-request.dto';

export class UpdateTrainingRequestDto extends PartialType(CreateTrainingRequestDto) {}
