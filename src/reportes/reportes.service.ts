import { Injectable } from '@nestjs/common';
import { billReports } from './documents/bill.reports';
import { PrinterService } from './helpers/printer.helper';
import { VentasService } from 'src/ventas/ventas.service';
import { billReport } from './documents/bill.report';
import { receiptReport } from './documents/receipt.report'
import { ClientesService } from 'src/clientes/clientes.service';
import { reportClients } from './documents/reportClients.report';
import { GastosService } from 'src/gastos/gastos.service';
import { Venta } from 'src/ventas/entities/venta.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Gasto } from 'src/gastos/entities/gasto.entity';

@Injectable()
export class ReportesService {
  constructor(
    private readonly printer: PrinterService,
    private readonly ventasService: VentasService,
    private readonly clientesService: ClientesService,
    @InjectRepository(Venta)
    private readonly ventasRepository: Repository<Venta>,
    @InjectRepository(Gasto)
    private readonly gastoRepository: Repository<Gasto>,
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

  async reporteVentasGastos(fechaInicio: string, fechaFin: string, almacen: string, usuario: string) {
    const FILTRO_SIN_RESTRICCION = 'xx';

    try {
      // Si todas las condiciones son 'xx', obtenemos todas las ventas y gastos sin filtro
      if (fechaInicio === FILTRO_SIN_RESTRICCION && fechaFin === FILTRO_SIN_RESTRICCION && almacen === FILTRO_SIN_RESTRICCION) {
        const [ventas, gastos] = await Promise.all([
          this.ventasRepository.find({
            relations: ['detalles', 'detalles.producto', 'almacen', 'cliente', 'vendedor', 'caja'],
          }),
          this.gastoRepository.find({
            relations: ['usuario', 'categoria', 'caja','almacen'],
          })
        ]);

        return { ventas, gastos };
      }

      // Normalizamos las fechas a medianoche
      const normalizeDate = (date: string): Date => {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
          throw new Error(`Fecha inválida: ${date}`);
        }
        d.setHours(0, 0, 0, 0);
        return d;
      };

      const fechaInicioNormalizada = fechaInicio !== FILTRO_SIN_RESTRICCION ? normalizeDate(fechaInicio) : null;
      const fechaFinNormalizada = fechaFin !== FILTRO_SIN_RESTRICCION ? normalizeDate(fechaFin) : null;

      // Si la fecha final es la misma que la inicial, ajustamos al final del día
      if (fechaInicioNormalizada && fechaFinNormalizada && fechaInicio === fechaFin) {
        fechaFinNormalizada.setHours(23, 59, 59, 999);
      }

      // Construcción de condiciones de búsqueda
      const whereVentas: any = {};
      const whereGastos: any = {};

      if (fechaInicioNormalizada && fechaFinNormalizada) {
        whereVentas.fecha = Between(fechaInicioNormalizada, fechaFinNormalizada);
        whereGastos.fecha = Between(fechaInicioNormalizada, fechaFinNormalizada);
      } else if (fechaInicioNormalizada) {
        whereVentas.fecha = MoreThanOrEqual(fechaInicioNormalizada);
        whereGastos.fecha = MoreThanOrEqual(fechaInicioNormalizada);
      } else if (fechaFinNormalizada) {
        whereVentas.fecha = LessThanOrEqual(fechaFinNormalizada);
        whereGastos.fecha = LessThanOrEqual(fechaFinNormalizada);
      }

      if (almacen !== FILTRO_SIN_RESTRICCION) {
        whereVentas.almacen = { id: almacen };
        whereGastos.almacen = { id: almacen };
      }

      if (usuario !== FILTRO_SIN_RESTRICCION) {
        whereVentas.vendedor = { id: usuario };
        whereGastos.usuario = { id: usuario };
      }

      const [ventas, gastos] = await Promise.all([
        this.ventasRepository.find({
          where: whereVentas,
          relations: ['detalles', 'detalles.producto', 'almacen', 'cliente', 'vendedor', 'caja'],
        }),
        this.gastoRepository.find({
          where: whereGastos,
          relations: ['usuario', 'categoria', 'caja','almacen'],
        })
      ]);

      return { ventas, gastos };
    } catch (error) {
      console.error('Error al generar el reporte de ventas y gastos:', error);
      throw new Error('Error interno del servidor');
    }
  }

}
