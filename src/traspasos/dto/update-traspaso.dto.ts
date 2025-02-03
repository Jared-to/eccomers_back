import { PartialType } from '@nestjs/mapped-types';
import { CreateTraspasoDto } from './create-traspaso.dto';

export class UpdateTraspasoDto extends PartialType(CreateTraspasoDto) {}
