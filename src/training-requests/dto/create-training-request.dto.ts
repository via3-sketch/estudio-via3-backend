import {
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateTrainingRequestDto {
  @ApiProperty({
    example: 15,
    description:
      'Número de personas a capacitar',
  })
  @IsNotEmpty({
    message:
      'La cantidad de participantes es obligatoria',
  })
  @IsInt({
    message: 'Debe ser un número entero',
  })
  @Min(1, {
    message:
      'Debe haber al menos 1 participante',
  })
  participantsCount!: number;

  @ApiProperty({
    example:
      'Lograr que el equipo de ventas domine las herramientas de cierre digital.',
    description:
      'Objetivos principales de la capacitación',
  })
  @IsNotEmpty({
    message:
      'Los objetivos son obligatorios',
  })
  @IsString({
    message:
      'Los objetivos deben ser un texto',
  })
  @MinLength(20, {
    message:
      'Por favor, detalla más los objetivos (mínimo 20 caracteres)',
  })
  objectives!: string;

  @ApiProperty({
    example:
      'Empresa del sector retail con alta rotación de personal en el área comercial.',
    description:
      'Contexto o situación actual de la empresa',
  })
  @IsNotEmpty({
    message:
      'El contexto es obligatorio',
  })
  @IsString({
    message:
      'El contexto debe ser un texto',
  })
  @MinLength(30, {
    message:
      'El contexto es muy corto, brinda más detalles (mínimo 30 caracteres)',
  })
  context!: string;
}