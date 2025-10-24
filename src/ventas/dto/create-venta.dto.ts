import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateDetalleVentaDto {
  @IsString()
  @IsNotEmpty()
  id_producto: string;


  @IsString()
  @IsNotEmpty()
  nombreVariante?: string;

  @IsNumber()
  precio: number;

  @IsNumber()
  @Min(1)
  cantidad: number;


  @IsString()
  unidad_medida: string;


  @IsNumber()
  descuento: number;

  @IsNumber()
  subtotal: number;


}

export class CreateVentaDto {

  @IsString()
  cliente: string;

  @IsString()
  vendedor: string;

  @IsString()
  almacen: string;

  @IsString()
  fecha?: Date;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  total: number;

  @IsNumber()
  @IsOptional()
  montoRecibido?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  montoQR?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  montoEfectivo?: number;

  @IsUUID()
  @IsOptional()
  descuento?: string;

  @IsEnum(['EFECTIVO', 'QR', 'QR-EFECTIVO'])
  tipo_pago: string;

  @IsString()
  @IsOptional()
  glosa?: string;

  @IsString()
  cajaId: string;

  @IsBoolean()
  ventaAlContado: boolean;

  @IsString()
  @IsOptional()
  idQR?: string;

  @IsString()
  @IsOptional()
  aliasQR?: string;

  @IsOptional()
  @IsBoolean()
  estadoPago?: boolean;

  @IsArray()
  @IsOptional()
  detalles: CreateDetalleVentaDto[];

}
