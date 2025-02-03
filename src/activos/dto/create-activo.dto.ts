import { IsDate, IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Min } from 'class-validator';

export class CreateActivoDto {
  @IsString()
  descripcion: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsDateString()
  fechaAdquisicion?: Date;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: Date;

  @IsString()
  tipo: string;

  @IsOptional()
  @IsString()
  proveedor?: string;

  @IsUUID()
  categoria: string;

  @IsNumber()
  @IsPositive()
  @Min(0)
  cantidad: number

}
