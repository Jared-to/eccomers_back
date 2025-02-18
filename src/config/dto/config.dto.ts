import { IsOptional, IsString } from "class-validator";


export class ConfigDto {

  @IsString()
  @IsOptional()
  linkFacebook: string;

  @IsString()
  @IsOptional()
  linkInstagram: string;

  @IsString()
  @IsOptional()
  linkTiktok: string;

  @IsString()
  @IsOptional()
  telefonoPrincipal: string;


}