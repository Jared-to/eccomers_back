import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { Response } from 'express';

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
    const pdfDoc = await this.reportesService.obtenerPdfVentaRollo(id);

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
}
