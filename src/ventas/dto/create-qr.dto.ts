import { IsString, IsNumber, Min } from 'class-validator';

export class CreateQRDto {
  @IsString()
  detalle: string;

  @IsNumber()
  @Min(1)
  monto: number;

  @IsString()
  codigo: string;

  @IsString()
  alias: string;

}