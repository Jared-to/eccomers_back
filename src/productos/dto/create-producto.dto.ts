import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, IsOptional, MinLength, IsPositive, Min, IsArray, ValidateNested } from 'class-validator';

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
  @IsNotEmpty()
  categoriaId: string;

  @IsOptional()
  imagen?: string;


  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVarianteProductoDto)
  variantes: CreateVarianteProductoDto[];
}
export class CreateVarianteProductoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la variante es obligatorio' })
  nombre: string;

  @IsString()
  precio: string;

  @IsOptional()
  id?: number;

}
