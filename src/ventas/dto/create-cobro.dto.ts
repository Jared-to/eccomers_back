import { IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateCobroDto {

    @IsUUID()
    @IsOptional()
    ventaId: string;

    
    @IsString()
    @IsOptional()
    cobrador: string;

    @IsString()
    @IsOptional()
    metodoPago: string

    @IsOptional()
    @IsNumber()
    cuotas?: number;

    @IsOptional()
    @IsNumber()
    diaPago?: number;

    @IsOptional()
    @IsNumber()
    monto?: number;

    @IsString()
    @IsOptional()
    glosa?: string;


}
