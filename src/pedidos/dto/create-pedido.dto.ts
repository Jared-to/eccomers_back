import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePedidoDto {
  @IsOptional()
  @IsString()
  nombreSolicitante?: string;

  @IsOptional()
  @IsString()
  apellidoSolicitante?: string;

  @IsOptional()
  @IsString()
  numeroSolicitante?: string;

  @IsOptional()
  @IsString()
  nombreFactura?: string;

  @IsOptional()
  @IsString()
  nitCi?: string;

  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @IsEnum(['DELIVERY', 'RECOJO'])
  formaEntrega: string;

  @IsOptional()
  @IsString()
  dir_gps?: string;

  @IsOptional()
  fechaHoraRecojo?: Date;

  @IsEnum(['EFECTIVO', 'QR'])
  metodoPago: string;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsNumber()
  delivery?: number;

  @IsString()
  glosa?: string;

  @IsUUID()
  sucursal: string

  @IsOptional()
  detalles?: any;

  // @IsOptional()
  // @IsString()
  // idQR?: string

}

export class CreateDetallePedidoDto {
  @IsNotEmpty()
  @IsString()
  productoId: string;

  @IsNotEmpty()
  @IsString()
  variante: string;

  @IsNotEmpty()
  @IsNumber()
  cantidad: number;

  @IsNotEmpty()
  @IsNumber()
  precio: number;

  @IsNotEmpty()
  @IsString()
  unidad_medida: string;

  @IsNotEmpty()
  @IsNumber()
  subtotal: number;

}