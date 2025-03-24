
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDate, IsUUID, IsDateString } from 'class-validator';


export class CreateDescuentoDto {


  @IsUUID()
  usuarioId: string; // Relación con el usuario, ya que el usuario es referenciado por 'usuario_id'

  @IsString()
  @IsNotEmpty()
  descuento: string;

  @IsNumber()
  @IsNotEmpty()
  porcentaje: number;

  @IsDateString()
  fechaInicio: Date;

  @IsDateString()
  fechaFin: Date;
}
