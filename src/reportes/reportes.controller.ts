import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query, Req, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ValidRoles } from 'src/auth/interface/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/auth/entities/user.entity';
import { ReportesService } from './reportes.service';

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
  @Get('pedido/:id')
  async obtenerPdfPedido(@Param('id') id: string, @Res() response: Response) {
    // Llamar al servicio para obtener el documento PDF
    const pdfDoc = await this.reportesService.obtenerPdfPedido(id);

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

  @Get('gastos')
  @Auth(ValidRoles.admin, ValidRoles.user)
  async obtenerPdfGastos(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Req() req,
    @Res() response: Response,
  ) {
    
    try {
      const usuario: User = req.user; // Obtener el usuario autenticado
      const pdfDoc = await this.reportesService.obtenerPdfGastos(fechaInicio, fechaFin, usuario);
      
      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="Reporte-Gastos-${fechaInicio}_to_${fechaFin}.pdf"`,
      );
      pdfDoc.info.Title = `Reporte de Gastos (${fechaInicio} - ${fechaFin})`;
      pdfDoc.pipe(response);
      pdfDoc.end();
    } catch (error) {
      response.status(500).json({ message: 'Error al generar el reporte', error });
    }
  }

  // Reporte de ventas en un rango de fechas
  @Get('ventasFecha')
  @Auth(ValidRoles.admin, ValidRoles.user)
  async obtenerPdfVentasFecha(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Req() req,
    @Res() response: Response,
  ) {
    try {
      const usuario: User = req.user; // Obtener el usuario autenticado
      // Llamamos al servicio de reportes para generar el PDF
      const pdfDoc = await this.reportesService.reporteVentasPDF(fechaInicio, fechaFin, usuario);
      
      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="Reporte-Ventas-${fechaInicio}_to_${fechaFin}.pdf"`,
      );
      pdfDoc.info.Title = `Reporte de Ventas (${fechaInicio} - ${fechaFin})`;
      pdfDoc.pipe(response);
      pdfDoc.end();
    } catch (error) {
      response.status(500).json({ message: 'Error al generar el reporte de ventas', error });
    }
  }
}
