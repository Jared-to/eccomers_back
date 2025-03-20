import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { Response } from 'express';
import { ValidRoles } from 'src/auth/interface/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly reportesService: ReportesService,
  ) { }

  @Get('ventas')
  async obtenerPdfVentas(@Res() response: Response) {
    const pdfDoc = await this.reportesService.obtenerPdfVentas();

    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.info.Title = 'Factura';
    pdfDoc.pipe(response);
    pdfDoc.end();
  }
  //Reporte de ventas
  @Get('ventas/:id')
  async obtenerPdfVenta(@Param('id') id: string, @Res() response: Response) {
    const pdfDoc = await this.reportesService.obtenerPdfVenta(id);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="Reporte-venta_.pdf"`,
    );
    pdfDoc.info.Title = `Factura Venta ${id}`;
    pdfDoc.pipe(response);
    pdfDoc.end();
  }
  //Reporte de ventas rollo
  @Get('ventas/rollo/:id')
  async obtenerPdfVentaRollo(@Param('id') id: string, @Res() response: Response) {
    const pdfDoc = await this.reportesService.obtenerPdfVenta2(id);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="Reporte-venta_.pdf"`,
    );
    pdfDoc.info.Title = `Recibo Venta ${id}`;
    pdfDoc.pipe(response);
    pdfDoc.end();
  }
  @Get('clientes')
  async obtenerClientes(@Res() response: Response) {
    const pdfDoc = await this.reportesService.obtenerPdfClientes();

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="Reporte-venta_.pdf"`,
    );
    pdfDoc.info.Title = `Reporte Clientes`;
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('general/')
  @Auth(ValidRoles.admin, ValidRoles.user)
  async findAllDates(
    @Query('fechaInicio') fechaInicio: string | 'xx',
    @Query('fechaFin') fechaFin: string | 'xx',
    @Query('almacen') almacen: string | 'xx',
    @Query('usuario') usuario: string | 'xx',
  ): Promise<Object> {

    return this.reportesService.reporteVentasGastos(fechaInicio, fechaFin, almacen, usuario);
  }

  //MODIFICADO
  @Get('caja/:id')
  async obtenerPdfCaja(@Param('id') id: string, @Res() response: Response) {
    const pdfDoc = await this.reportesService.obtenerPdfCaja(id);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="Reporte-Caja-${id}.pdf"`);
    pdfDoc.info.Title = `Reporte Caja ${id}`;
    pdfDoc.pipe(response);
    pdfDoc.end();
  }
  @Get('pedido/:id/:tipo')
  async obtenerPdfPedido(@Param('id') id: string, @Param('tipo') tipo: string, @Res() response: Response) {
    // Llamar al servicio para obtener el documento PDF
    const pdfDoc = await this.reportesService.obtenerPdfPedido(id, tipo);

    // Configurar los encabezados de la respuesta
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="Reporte-Pedido-${id}.pdf"`, // El nombre del archivo PDF será "Reporte-Pedido-{id}.pdf"
    );

    // Asignar el título al documento PDF
    pdfDoc.info.Title = `Recibo Pedido ${id}`;

    // Enviar el documento PDF como respuesta
    pdfDoc.pipe(response);
    pdfDoc.end();
  }
}
