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
import { Between, LessThanOrEqual, MoreThanOrEqual, Raw, Repository } from 'typeorm';
import { Gasto } from 'src/gastos/entities/gasto.entity';
import { Caja } from 'src/cajas/entities/caja.entity';
import { cajaReport } from './documents/reportCaja.report';
import { Pedido } from 'src/pedidos/entities/pedido.entity';
import { ReciboPedido } from './documents/bill.reportPedido.report';
import { ReciboPedidoVenta } from './documents/bill.reportVenta.report';
import { ReportGastos } from './documents/reportGastos.report';
import { ReportVentas } from './documents/reportVentasFechas.report';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ReportesService {
  constructor(
    private readonly printer: PrinterService,
    private readonly ventasService: VentasService,
    private readonly clientesService: ClientesService,
    private readonly gastosService: GastosService,
    @InjectRepository(Venta)
    private readonly ventasRepository: Repository<Venta>,
    @InjectRepository(Gasto)
    private readonly gastoRepository: Repository<Gasto>,
    @InjectRepository(Caja)
    private readonly cajaRepository: Repository<Caja>,
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
  ) { }

  //Codigo Modificado
  async obtenerPdfCaja(id: string): Promise<PDFKit.PDFDocument> {
    const caja = await this.cajaRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!caja) {
      throw new Error('No se encontró la caja');
    }

    // Obtener las ventas asociadas a la caja
    const ventas = await this.ventasRepository.find({
      where: { caja: { id } },
      relations: ['vendedor'], // Agrega las relaciones necesarias
    });

    const gastos = await this.gastoRepository.find({
      where: { caja: { id } },
      relations: ['usuario', 'categoria'],
    });

    // Pasar caja y ventas a cajaReport
    const docDefinition = cajaReport(caja, ventas, gastos);

    return this.printer.createPdf(docDefinition);
  }

  async obtenerPdfPedido(id: string, tipo: string): Promise<PDFKit.PDFDocument> {
    // Buscar el pedido con las relaciones necesarias
    const whereCondition = tipo === 'pedido'
      ? { id: id }
      : { venta: { id: id } };

    const pedido = await this.pedidoRepository.findOne({
      where: whereCondition,
      relations: ['usuario', 'detalles', 'detalles.producto', 'almacen'],
    });

    if (!pedido) {
      throw new Error('No se encontró el pedido');
    }

    // Generar el contenido del PDF con los datos del pedido
    const docDefinition = ReciboPedido(pedido);

    // Crear el archivo PDF usando el servicio Printer (si lo tienes)
    const pdfDoc = this.printer.createPdf(docDefinition);

    // Retornar el documento PDF
    return pdfDoc;
  }
  async obtenerPdfVenta2(id: string): Promise<PDFKit.PDFDocument> {

    const pedido = await this.ventasRepository.findOne({
      where: { id },
      relations: ['vendedor', 'cliente', 'detalles', 'detalles.producto', 'almacen'],
    });

    if (!pedido) {
      throw new Error('No se encontró el pedido');
    }

    // Generar el contenido del PDF con los datos del pedido
    const docDefinition = ReciboPedidoVenta(pedido);

    // Crear el archivo PDF usando el servicio Printer (si lo tienes)
    const pdfDoc = this.printer.createPdf(docDefinition);

    // Retornar el documento PDF
    return pdfDoc;
  }


  // ReportesGasto
  async obtenerPdfGastos(fechaInicio: string, fechaFin: string, usuario: User): Promise<PDFKit.PDFDocument> {
    const gastos = await this.gastosService.findAllDates(fechaInicio, fechaFin, usuario);

    if (gastos.length === 0) {
      throw new Error('No se encontraron gastos en el rango de fechas seleccionado');
    }

    const docDefinition = ReportGastos(gastos, fechaInicio, fechaFin);

    return this.printer.createPdf(docDefinition);
  }

  // Reporte de Ventas
  async reporteVentasPDF(fechaInicio: string, fechaFin: string, usuario: User): Promise<PDFKit.PDFDocument> {
    // Pasamos las fechas al reporte de ventas

    const ventas = await this.ventasService.findAllDates(fechaInicio, fechaFin, usuario);

    if (ventas.length === 0) {
      throw new Error('No se encontraron ventas en el rango de fechas seleccionado');
    }

    const docDefinition = ReportVentas(ventas, fechaInicio, fechaFin);

    return this.printer.createPdf(docDefinition);
  }

  //END MODIFICADO

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
            order: { fecha: 'desc' },
            relations: ['detalles', 'detalles.producto', 'almacen', 'cliente', 'vendedor', 'caja'],
          }),
          this.gastoRepository.find({
            order: { fecha: 'desc' },
            relations: ['usuario', 'categoria', 'caja', 'almacen'],
          })
        ]);

        return { ventas, gastos };
      }


      const fechaInicioNormalizada = fechaInicio !== FILTRO_SIN_RESTRICCION ? (fechaInicio) : null;
      const fechaFinNormalizada = fechaFin !== FILTRO_SIN_RESTRICCION ? (fechaFin) : null;


      // Construcción de condiciones de búsqueda
      const whereVentas: any = {};
      const whereGastos: any = {};

      if (fechaInicioNormalizada && fechaFinNormalizada) {
        whereVentas.fecha = Between(fechaInicioNormalizada, fechaFinNormalizada);
        whereGastos.fecha = Between(fechaInicioNormalizada, fechaFinNormalizada);

        if (fechaInicioNormalizada && fechaFinNormalizada) {
          whereVentas.fecha = Raw(alias => `
              DATE(${alias}) BETWEEN DATE('${fechaInicioNormalizada}') AND DATE('${fechaFinNormalizada}')
            `);
          whereGastos.fecha = Raw(alias => `
              DATE(${alias}) BETWEEN DATE('${fechaInicioNormalizada}') AND DATE('${fechaFinNormalizada}')
            `);
        }
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
          order: { fecha: 'DESC' },
          relations: ['detalles', 'detalles.producto', 'almacen', 'cliente', 'vendedor', 'caja'],
        }),
        this.gastoRepository.find({
          where: whereGastos,
          order: { fecha: 'DESC' },
          relations: ['usuario', 'categoria', 'caja', 'almacen'],
        })
      ]);

      return { ventas, gastos };
    } catch (error) {
      console.error('Error al generar el reporte de ventas y gastos:', error);
      throw new Error('Error interno del servidor');
    }
  }

}
