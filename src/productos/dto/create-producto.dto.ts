import { IsNotEmpty, IsString, IsNumber, IsOptional, MinLength, IsPositive } from 'class-validator';

export class CreateProductoDto {

  @MinLength(2)
  @IsString()
  alias: string;

  @IsOptional()
  @IsString()
  descripcion: string;

  @IsOptional()
  @IsString()
  marca: string;

  @IsOptional()
  @IsString()
  codigo: string;

  @IsString()
  unidad_medida: string;

  @IsString()
  sku: string;

  @IsString()
  precio_venta: string;

  @IsOptional()
  @IsString()
  precio_min_venta?:string;

  @IsString()
  @IsNotEmpty()
  categoriaId: string;

  @IsOptional() 
  imagen?: string;
}
