import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, Req, Query, Res } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interface/valid-roles';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities/user.entity';
import { Response } from 'express';
import { VentasService } from 'src/ventas/ventas.service';


@Controller('excel')
export class ExcelController {
  constructor(
    private readonly excelService: ExcelService,
    private readonly ventasService: VentasService
  ) { }

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
  @Get('ventas')
  @Auth(ValidRoles.admin, ValidRoles.user)
  async reportVentas(
    @Query('fechaInicio') fechaInicio: string | 'xx',
    @Query('fechaFin') fechaFin: string | 'xx',
    @GetUser() user: User,
    @Res() response: Response) {
    try {
      const ventas = await this.ventasService.findAllDates(fechaInicio, fechaFin, user);

      const filePath = await this.excelService.generarReporteVentas(ventas);

      response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      response.setHeader(
        'Content-Disposition',
        'attachment; filename="Reporte-ventas.xlsx"',
      );

      response.download(filePath, 'Reporte-ventas.xlsx', (err) => {
        if (err) {
          console.error('Error al descargar el archivo:', err);
          response.status(500).send('Error al generar el reporte.');
        }
      });
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      response.status(500).send('Error interno del servidor');
    }
  }
}
