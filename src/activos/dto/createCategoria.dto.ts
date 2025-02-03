import { IsOptional, IsString } from "class-validator";


export class CreateCategoriaActivoDto {

  @IsString()
  nombre: string;

  @IsOptional()
  descripcion: string;
}
