import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TrainingRequestService } from './training-request.service';

import { CreateTrainingRequestDto } from './dto/create-training-request.dto';

import { UpdateTrainingRequestDto } from './dto/update-training-request.dto';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from '../auth/guards/auth.guard';

import type { RequestWithUsers } from './interfaces/requests-payloads.interfaces';
import { Role } from '../users/enums/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorator/roles.decorator';

@ApiTags('Training Requests')
@ApiBearerAuth('Bearer')
@UseGuards(AuthGuard)
@Controller('training-requests')
export class TrainingRequestController {
  constructor(
    private readonly trainingRequestService: TrainingRequestService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Crea una nueva solicitud de capacitación',
  })
  @ApiResponse({
    status: 201,
    description:
      'La solicitud ha sido creada con éxito.',
  })
  async create(
    @Body()
    createTrainingRequestDto: CreateTrainingRequestDto,

    @Req()
    req: RequestWithUsers,
  ) {
    const userId = req.user.id;

    return this.trainingRequestService.create(
      createTrainingRequestDto,
      userId,
    );
  }

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard) 
  @ApiOperation({ summary: 'Obtener todas las solicitudes (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de solicitudes obtenida con éxito.' })
  @ApiResponse({ status: 403, description: 'Prohibido. Se requiere rol de Admin.' })
  async findAll() {
    return await this.trainingRequestService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene una solicitud de capacitación por id' })
  @ApiResponse({ status: 200, description: 'Solicitud encontrada.' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.trainingRequestService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza una solicitud de capacitación' })
  @ApiResponse({ status: 200, description: 'Solicitud actualizada con éxito.' })
  update(
    @Param('id') id: string,
    @Body() updateTrainingRequestDto: UpdateTrainingRequestDto,
  ) {
    return this.trainingRequestService.update(id, updateTrainingRequestDto);
  }
}