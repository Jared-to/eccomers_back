import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateAlmacenDto {

  @IsString()
  @MinLength(4)
  nombre:string;

  @IsOptional()
  @IsString()
  ubicacion?:string;

  @IsOptional()
  @IsString()
  telefono?:string

  @IsOptional()
  @IsString()
  HoraAtencion?:string

  @IsOptional()
  @IsString()
  linkGPS?:string

}
