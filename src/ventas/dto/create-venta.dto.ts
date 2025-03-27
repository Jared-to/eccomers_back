import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

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

  @IsUUID()
  @IsOptional()
  descuento?: string;

  @IsEnum(['EFECTIVO', 'QR', 'TRANSFERENCIA'])
  tipo_pago: string;

  @IsString()
  @IsOptional()
  glosa?: string;

  @IsString()
  cajaId: string;

  @IsBoolean()
  ventaAlContado: boolean;

  @IsArray()
  @IsOptional()
  detalles: CreateDetalleVentaDto[];

}
