import { IsString, IsNumber, IsOptional } from 'class-validator';

export class ConfirmarPagoDto {
  @IsString()
  alias: string;

  @IsString()
  @IsOptional()
  numeroOrdenOriginante?: string;

  @IsNumber()
  @IsOptional()
  monto?: number;

  @IsString()
  @IsOptional()
  idQr?: string;

  @IsString()
  @IsOptional()
  moneda?: string;

  @IsString()
  @IsOptional()
  fechaproceso?: string;

  @IsString()
  @IsOptional()
  cuentaCliente?: string;

  @IsString()
  @IsOptional()
  nombreCliente?: string;

  @IsString()
  @IsOptional()
  documentoCliente?: string;
}