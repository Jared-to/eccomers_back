import { IsUUID, IsNumber } from "class-validator";

export class CreateCajaDto {
  @IsUUID()
  usuarioId: string;

  @IsNumber()
  saldoApertura: number;
}
