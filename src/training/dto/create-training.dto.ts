import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateTrainingDto {
  @IsNotEmpty({ message: 'El título de la capacitación es obligatorio' })
  @IsString({ message: 'El título debe ser un texto' })
  @ApiProperty({
    description: 'Este campo debe contener el título de la capacitación',
    example: 'Service Title Test 01',
  })
  title!: string;

  @IsNotEmpty({ message: 'La breve descripción es obligatoria' })
  @IsString({ message: 'La breve descripción debe ser un texto' })
  @Length(10, 120, {
    message: 'La breve descripción debe tener entre 10 y 120 caracteres',
  })
  @ApiProperty({
    description: 'Descripción breve que aparece en la card de la capacitación',
    example: 'Service ShortDescription Test 01',
  })
  shortDescription!: string;

  @IsNotEmpty({ message: 'La descripción de la capacitación es obligatoria' })
  @IsString({ message: 'La descripción debe ser un texto' })
  @ApiProperty({
    description: 'Este campo debe contener la descripción de la capacitación',
    example: 'Service Description Test 01',
  })
  description!: string;

  @IsNotEmpty({ message: 'El tagline es obligatorio' })
  @IsString({ message: 'El tagline debe ser un texto' })
  @Length(10, 150, {
    message: 'El tagline debe tener entre 10 y 150 caracteres',
  })
  @ApiProperty({
    description: 'Frase destacada que aparece en el detalle de la capacitación',
    example: 'Service Tagline Test 01',
  })
  tagline!: string;

  @IsNotEmpty({
    message: 'El detalle de lo que incluye la capacitación es obligatorio',
  })
  @IsArray({ message: 'Los includes deben ser un array' })
  @IsString({ each: true, message: 'Cada include debe ser un texto' })
  @ApiProperty({
    description: 'Lista de ítems que incluye la capacitación',
    example: [
      'Service Include Test 01',
      'Service Include Test 02',
      'Service Include Test 03',
    ],
  })
  includes!: string[];

  @IsNotEmpty({ message: 'La categoría de la capacitación es obligatoria' })
  @IsString({ message: 'La categoría debe ser un texto' })
  @ApiProperty({
    description: 'Este campo debe contener la categoría de la capacitación',
    example: 'Service Category Test 01',
  })
  category!: string;

  @IsOptional()
  @IsString({ message: 'La URL de la imágen debe ser un texto' })
  @ApiProperty({
    description:
      'La imágen debe ser un formáto válido, que termine en .jpg/.jpeg/.png/.webp',
    example: 'http://......jpg',
  })
  imgUrl?: string;
}
