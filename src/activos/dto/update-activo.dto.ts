import { PartialType } from '@nestjs/mapped-types';
import { CreateActivoDto } from './create-activo.dto';

export class UpdateActivoDto extends PartialType(CreateActivoDto) {}
