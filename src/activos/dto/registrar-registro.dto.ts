import { IsDateString, IsInt, IsNumber, IsPositive, IsString, IsUUID } from "class-validator";

export class CreateRegistroDto {


  @IsDateString()
  fecha?: Date;

  @IsString()
  glosa: string;

  @IsNumber()
  @IsPositive()
  @IsInt()
  cantidad: number;

  @IsString()
  tipo: string;

  @IsUUID()
  user:string;
}