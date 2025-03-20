import { Type } from "class-transformer";
import { IsArray, IsDecimal, IsInt, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from "class-validator";

export class InventarioInicialDto {
  @IsString()
  @IsNotEmpty()
  almacen_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductoInicialDto) 
  productos: ProductoInicialDto[];
}

export class ProductoInicialDto {
  @IsString()
  @IsNotEmpty()
  producto_id: string;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsDecimal()
  precio_compra?: number;

}
