import { IsNumber, IsPositive, IsString } from "class-validator";

export class CreateInventarioDto {

  @IsString()
  almacenId: string;

  @IsString()
  productoId: string; 

  @IsNumber()
  @IsPositive()
  cantidad: number; 

}
