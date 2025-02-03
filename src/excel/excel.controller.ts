import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { FileInterceptor } from '@nestjs/platform-express';


@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) { }

  @Post('upload-excel-inventario')
  @UseInterceptors(FileInterceptor('file'))
  async excelIncrementarInventario(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      return { message: 'No se ha subido ningún archivo' };
    }

    const user = req.user

    // Llamar al servicio para procesar el archivo Excel
    return this.excelService.procesarExcel(file, user);
  }
}
