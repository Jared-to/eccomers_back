import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateCobroDto } from './create-cobro.dto';
import { Type } from 'class-transformer';

export class CreateDetalleVentaDto {
  @IsString()
  @IsNotEmpty()
  id_producto: string;

  @IsNumber()
  precio: number;

  @IsNumber()
  cantidad: number;

  @IsString()
  codigo_barras: string;

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
  descuento: number;

  @IsEnum(['EFECTIVO', 'QR', 'TRANSFERENCIA'])
  tipo_pago: string;

  @IsString()
  cajaId: string;

  @IsBoolean()
  ventaAlContado: boolean;
  
  @IsArray()
  @IsOptional()
  detalles: CreateDetalleVentaDto[];

}
