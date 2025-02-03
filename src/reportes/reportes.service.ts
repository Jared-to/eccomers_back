import { Injectable } from '@nestjs/common';
import { billReports } from './documents/bill.reports';
import { PrinterService } from './helpers/printer.helper';
import { VentasService } from 'src/ventas/ventas.service';
import { billReport } from './documents/bill.report';
import { receiptReport } from './documents/receipt.report'
import { ClientesService } from 'src/clientes/clientes.service';
import { reportClients } from './documents/reportClients.report';

@Injectable()
export class ReportesService {
  constructor(
    private readonly printer: PrinterService,
    private readonly ventasService: VentasService,
    private readonly clientesService: ClientesService,
  ) { }

  async obtenerPdfVentas(): Promise<PDFKit.PDFDocument> {
    const docDefinition = billReports();

    return this.printer.createPdf(docDefinition);
  }
  async obtenerPdfVenta(id: string): Promise<PDFKit.PDFDocument> {
    // Busca la venta con el id proporcionado
    const venta = await this.ventasService.findOne(id);

    // Genera el contenido dinámico para el PDF basado en la venta encontrada
    const docDefinition = billReport(venta);

    // Devuelve el PDF generado
    return this.printer.createPdf(docDefinition);
  }
  async obtenerPdfVentaRollo(id: string): Promise<PDFKit.PDFDocument> {
    // Busca la venta con el id proporcionado
    const venta = await this.ventasService.findOne(id);

    // Genera el contenido dinámico para el PDF basado en la venta encontrada
    const docDefinition = receiptReport(venta);

    // Devuelve el PDF generado
    return this.printer.createPdf(docDefinition);
  }
  async obtenerPdfClientes(): Promise<PDFKit.PDFDocument> {
    const clientes = await this.clientesService.findAll()
    const docDefinition = reportClients(clientes);

    return this.printer.createPdf(docDefinition);
  }
}
