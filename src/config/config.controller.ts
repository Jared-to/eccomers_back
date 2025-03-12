import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ConfigService } from './config.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigDto } from './dto/config.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interface/valid-roles';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) { }

  @Patch('qr')
  @UseInterceptors(FileInterceptor('file'))
  colocarQr(@UploadedFile() file?: Express.Multer.File,) {
    return this.configService.asignarQR(file);
  }

  @Patch('imagen')
  @UseInterceptors(FileInterceptor('file'))
  colocarImagen(@UploadedFile() file?: Express.Multer.File,) {
    return this.configService.asignarImagen(file);
  }

  @Patch('redes')
  updateConfig(@Body() updateConfigDto: ConfigDto) {

    return this.configService.updateConfig(updateConfigDto);
  }

  @Get()
  @Auth(ValidRoles.admin, ValidRoles.user)
  getData() {
    return this.configService.find();
  }

  @Get('publicas')
  getDataPublic() {
    return this.configService.find();
  }


}
