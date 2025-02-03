import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Venta } from './entities/venta.entity';
import { CreateDetalleVentaDto, CreateVentaDto } from './dto/create-venta.dto';
import { DetalleVenta } from './entities/detalle-venta.entity';
import { InventarioService } from 'src/inventario/inventario.service';
import { MovimientosAlmacenService } from 'src/inventario/service/movimientos-almacen.service';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { Almacen } from 'src/almacenes/entities/almacen.entity';
import { CajasService } from 'src/cajas/cajas.service';
import { AuthService } from 'src/auth/auth.service';
import { Cobros } from './entities/cobros.entity';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventasRepository: Repository<Venta>,
    @InjectRepository(DetalleVenta)
    private readonly detallesRepository: Repository<DetalleVenta>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(Almacen)
    private readonly almacenRepository: Repository<Almacen>,
    @InjectRepository(Cobros)
    private readonly cobrosRepository: Repository<Cobros>,
    private readonly inventarioService: InventarioService,
    private readonly movimientosService: MovimientosAlmacenService,
    private readonly dataSource: DataSource,

  ) { }

  async create(createVentaDto: CreateVentaDto): Promise<Venta> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { detalles, ventaAlContado, cobro, ...ventaData } = createVentaDto;

      // Crear y guardar la venta
      const venta = this.ventasRepository.create({
        ...ventaData,
        vendedor: { id: ventaData.vendedor },
        caja: { id: ventaData.cajaId },
        cliente: { id: ventaData.cliente },
      });
      const ventaGuardada = await queryRunner.manager.save(Venta, venta);

      // Generar código único
      ventaGuardada.codigo = `V${(ventaGuardada.increment || 1).toString().padStart(4, '0')}`;
      await queryRunner.manager.save(Venta, ventaGuardada);

      // Validar y guardar los detalles de la venta
      if (!detalles || detalles.length === 0) {
        throw new NotFoundException('Debe incluir al menos un detalle en la venta');
      }
      await this.guardarDetallesVenta(queryRunner, detalles, ventaGuardada);

      // Registrar movimientos de inventario
      await this.registrarMovimientosInventario(detalles, ventaGuardada.codigo);

      // Manejar cobros
      if (ventaAlContado) {
        await this.crearCobroContado(queryRunner, ventaGuardada);
      } else {
        await this.crearCobrosCredito(queryRunner, cobro, ventaGuardada);
      }

      await queryRunner.commitTransaction();
      return this.findOne(ventaGuardada.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('No se pudo crear la venta');
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, updateVentaDto: UpdateVentaDto): Promise<Venta> {
    const queryRunner = this.ventasRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // Buscar la venta existente
      const venta = await this.findOne(id);

      const { detalles, ...ventaData } = updateVentaDto;

      // 1. Devolver al inventario los productos de los detalles actuales
      for (const detalleActual of venta.detalles) {
        await this.registrarMovimiento({
          almacen_id: detalleActual.almacen.id,
          cantidad: detalleActual.cantidad,
          codigo_barras: detalleActual.codigo_barras,
          descuento: detalleActual.descuento,
          precio: detalleActual.precio,
          id_producto: detalleActual.producto.id,
          subtotal: detalleActual.subtotal,
          unidad_medida: detalleActual.unidad_medida
        }, 'devolucion', `Ajuste Venta - ${venta.codigo}`);
      }

      // 2. Eliminar los detalles antiguos
      await this.detallesRepository.delete({ venta: { id } });

      // 3. Crear los nuevos detalles y actualizar inventario
      if (detalles) {
        const nuevosDetalles = detalles.map((detalle) =>
          this.detallesRepository.create({
            ...detalle,
            producto: { id: detalle.id_producto },
            almacen: { id: detalle.almacen_id },
          }),
        );

        for (const detalleNuevo of nuevosDetalles) {
          await this.registrarMovimiento({
            almacen_id: detalleNuevo.almacen.id,
            cantidad: detalleNuevo.cantidad,
            codigo_barras: detalleNuevo.codigo_barras,
            descuento: detalleNuevo.descuento,
            precio: detalleNuevo.precio,
            id_producto: detalleNuevo.producto.id,
            subtotal: detalleNuevo.subtotal,
            unidad_medida: detalleNuevo.unidad_medida
          }, 'venta', `Ajuste Venta - ${venta.codigo}`);
        }

        venta.detalles = nuevosDetalles;
      }

      // 4. Actualizar datos de la venta
      Object.assign(venta, { ...ventaData, fechaEdit: new Date() });
      if (updateVentaDto.cobro) {
        //Verificar si es venta al contado
        if (!updateVentaDto.ventaAlContado) {
          await this.actualizarCobros(queryRunner, venta, updateVentaDto.cobro)
        } else {
          await this.crearCobroContado(queryRunner, venta);
        }
      }

      // Guardar cambios de la venta
      const ventaActualizada = await queryRunner.manager.save(Venta, venta);


      await queryRunner.commitTransaction();
      return ventaActualizada;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  async findAllDates(fechaInicio: string | 'xx', fechaFin: string | 'xx'): Promise<Venta[]> {

    // Si ambas fechas son 'xx', obtenemos todas las ventas
    if (fechaInicio === 'xx' && fechaFin === 'xx') {
      const ventas = await this.ventasRepository.find({
        relations: ['detalles', 'detalles.producto', 'detalles.almacen', 'cliente', 'vendedor', 'caja'],
      });

      return ventas;
    }

    // Normalizamos las fechas a medianoche para ignorar horas
    const normalizeDate = (date: string) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0); // Establecemos la hora a medianoche
      return d;
    };

    const fechaInicioNormalizada = normalizeDate(fechaInicio);
    const fechaFinNormalizada = normalizeDate(fechaFin);


    // Si la fecha final es hoy, ajustamos para obtener hasta el final del día (23:59:59)
    if (fechaFin === fechaInicio) {
      fechaFinNormalizada.setHours(23, 59, 59, 999); // Fin del día (23:59:59)
    }


    const whereConditions: any = {};

    // Filtrar por rango de fechas si ambas fechas son proporcionadas
    if (fechaInicio && fechaFin) {
      whereConditions.fecha = Between(fechaInicioNormalizada, fechaFinNormalizada);
    } else if (fechaInicio) {
      whereConditions.fecha = { $gte: fechaInicioNormalizada };
    } else if (fechaFin) {
      whereConditions.fecha = { $lte: fechaFinNormalizada };
    }

    const ventas = await this.ventasRepository.find({
      where: whereConditions,
      relations: ['detalles', 'detalles.producto', 'detalles.almacen', 'cliente', 'vendedor', 'caja'],
    });

    return ventas;
  }


  async findOne(id: string): Promise<Venta> {
    const venta = await this.ventasRepository.findOne({
      where: { id },
      relations: ['detalles', 'detalles.producto', 'detalles.almacen', 'cliente', 'vendedor'],
    });


    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }
    return venta;
  }


  async findOneEdit(id: string): Promise<Venta> {
    const venta = await this.ventasRepository.findOne({
      where: { id },
      relations: ['detalles', 'detalles.producto', 'detalles.almacen', 'cliente', 'vendedor', 'cobros'],
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    // Creamos un arreglo donde almacenaremos los detalles con el stock
    const result = [];

    for (const detalle of venta.detalles) {
      // Consulta para traer el stock desde la tabla inventario para cada producto en el detalle
      const inventario = await this.ventasRepository.manager
        .createQueryBuilder('inventario', 'i')
        .select('i.stock')
        .where('i.product = :id_producto', { id_producto: detalle.producto.id })
        .andWhere('i.almacen = :id_almacen', { id_almacen: detalle.almacen.id })
        .andWhere('i.codigo_barras = :codigo_barras', { codigo_barras: detalle.codigo_barras })
        .getRawOne();

      // Agregamos el stock al detalle correspondiente
      result.push({
        ...detalle,
        stock: inventario?.i_stock
      });
    }

    // Obtener el nombre del vendedor

    return {
      ...venta,
      detalles: result,
    };
  }


  async remove(id: string): Promise<void> {
    const queryRunner = this.ventasRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // Obtener la venta con sus detalles dentro de la transacción
      const venta = await queryRunner.manager.findOne(Venta, {
        where: { id },
        relations: ['detalles', 'detalles.almacen', 'detalles.producto'],
      });

      if (!venta) {
        throw new NotFoundException(`Venta con ID ${id} no encontrada`);
      }

      // Devolver al inventario los productos de los detalles
      for (const detalle of venta.detalles) {
        await this.registrarMovimiento(
          {
            almacen_id: detalle.almacen.id,
            cantidad: detalle.cantidad,
            codigo_barras: detalle.codigo_barras,
            descuento: detalle.descuento,
            precio: detalle.precio,
            id_producto: detalle.producto.id,
            subtotal: detalle.subtotal,
            unidad_medida: detalle.unidad_medida,
          },
          'devolucion',
          'Venta Eliminada',
        );
      }

      // Eliminar la venta y sus detalles (en cascada)
      await queryRunner.manager.remove(Venta, venta);

      // Confirmar la transacción
      await queryRunner.commitTransaction();
    } catch (error) {
      // Revertir la transacción en caso de error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar el QueryRunner
      await queryRunner.release();
    }
  }

  async findClients(id_cliente: string): Promise<Venta[]> {
    const ventas = await this.ventasRepository.find({
      where: { cliente: { id: id_cliente } },
      relations: ['cobros'],
    });
    return ventas;
  }
  //report
  async getTopUsedProducts(): Promise<any[]> {
    return this.detallesRepository
      .createQueryBuilder('detalle_venta')
      .select('detalle_venta.producto_id', 'productoId')
      .addSelect('SUM(detalle_venta.cantidad)', 'totalCantidad')
      .addSelect('SUM(detalle_venta.subtotal)', 'totalSubtotal')
      .addSelect('producto.descripcion', 'productoDescripcion') // Agregar descripción
      .innerJoin('detalle_venta.producto', 'producto') // Unir con la tabla 'producto'
      .groupBy('detalle_venta.producto_id')
      .addGroupBy('producto.descripcion') // Agrupar por descripción también
      .orderBy('SUM(detalle_venta.cantidad)', 'DESC')
      .limit(5)
      .getRawMany();
  }

  async getLatestSales(): Promise<Venta[]> {
    return this.ventasRepository.find({
      order: {
        fecha: 'DESC', // Ordena por la fecha en orden descendente
      },
      take: 5, // Limita a las últimas 5 ventas
      relations: ['cliente', 'detalles', 'vendedor'], // Carga relaciones necesarias
    });
  }
  async getSalesCount(): Promise<number> {
    return this.ventasRepository.count(); // Devuelve la cantidad de ventas
  }
  private async registrarMovimiento(detalle: CreateDetalleVentaDto, tipo: string, descripcion: string): Promise<void> {

    if (tipo === 'venta') {
      await this.inventarioService.descontarStock({
        almacenId: detalle.almacen_id,
        cantidad: detalle.cantidad,
        codigo_barras: detalle.codigo_barras,
        productoId: detalle.id_producto,
      });
      await this.movimientosService.registrarSalida({
        almacenId: detalle.almacen_id,
        cantidad: detalle.cantidad,
        productoId: detalle.id_producto,
        descripcion: descripcion,
        codigo_barras: detalle.codigo_barras,
      });
    } else {
      await this.inventarioService.agregarStock({
        almacenId: detalle.almacen_id,
        cantidad: detalle.cantidad,
        codigo_barras: detalle.codigo_barras,
        productoId: detalle.id_producto,
      });
      await this.movimientosService.registrarIngreso({
        almacenId: detalle.almacen_id,
        cantidad: detalle.cantidad,
        productoId: detalle.id_producto,
        descripcion: descripcion,
        codigo_barras: detalle.codigo_barras,
      });
    }
  }

  private async guardarDetallesVenta(queryRunner, detalles: CreateDetalleVentaDto[], venta: Venta): Promise<void> {
    for (const detalle of detalles) {
      const almacen = await this.almacenRepository.findOne({ where: { id: detalle.almacen_id } });
      const producto = await this.productoRepository.findOne({ where: { id: detalle.id_producto } });

      if (!almacen || !producto) {
        throw new NotFoundException('Producto o almacén no encontrado');
      }

      const detalleVenta = queryRunner.manager.create(DetalleVenta, {
        ...detalle,
        almacen,
        producto,
        venta,
      });
      await queryRunner.manager.save(DetalleVenta, detalleVenta);
    }
  }

  private async registrarMovimientosInventario(detalles, codigoVenta): Promise<void> {
    await Promise.all(
      detalles.map(detalle =>
        this.registrarMovimiento(detalle, 'venta', `Venta - ${codigoVenta}`),
      ),
    );
  }

  private async crearCobroContado(queryRunner, venta: Venta): Promise<void> {
    const cobro = this.cobrosRepository.create({
      venta,
      monto: venta.total,
      metodoPago: venta.tipo_pago,
    });
    venta.deuda = 0;
    venta.estadoCobro = true;
    venta.ventaAlContado = true;
    await queryRunner.manager.save(cobro);
    await queryRunner.manager.save(venta);
  }

  private async crearCobrosCredito(queryRunner, cobroData, venta: Venta): Promise<void> {
    const { monto, cuotas, glosa, diaPago } = cobroData;
    const montoPorCuota = parseFloat(((venta.total - monto) / cuotas).toFixed(2));
    let dia = {
      1: 'Lunes',
      2: 'Martes',
      3: 'Miercoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sabado',
      7: 'Domingo',
    }
    const cobroInicial = this.cobrosRepository.create({
      venta,
      monto,
      montoPagado: monto,
      metodoPago: venta.tipo_pago,
      glosa: glosa || 'Monto inicial',
      cobrado: true,
      proximoPago: venta.fecha,
      fechaPago: venta.fecha
    });

    venta.deuda = parseFloat((venta.total - monto).toFixed(2));
    venta.cuotas = cuotas;
    venta.diaPago = dia[diaPago];
    venta.estadoCobro = false;
    await queryRunner.manager.save(cobroInicial);
    await queryRunner.manager.save(venta);

    // Crear cuotas
    const cobros = [];
    for (let i = 1; i <= cuotas; i++) {
      cobros.push(
        this.cobrosRepository.create({
          venta,
          monto: montoPorCuota,
          proximoPago: this.calcularFechaCuota(diaPago, i),
          detalle: `Cuota ${i}`,
          cobrado: false,
        }),
      );
    }
    await queryRunner.manager.save(cobros);
  }
  private async actualizarCobros(queryRunner, venta: Venta, cobro: any): Promise<void> {
    let dia = {
      1: 'Lunes',
      2: 'Martes',
      3: 'Miercoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sabado',
      7: 'Domingo',
    }
    // Eliminar cobros existentes (si los hay)
    const cobrosExistentes = await this.cobrosRepository.find({ where: { venta: { id: venta.id } } });
    if (cobrosExistentes.length > 0) {
      await queryRunner.manager.remove(Cobros, cobrosExistentes);
    }

    // Extraer datos del cobro
    const { monto, cuotas, glosa, diaPago } = cobro;

    // Calcular el monto por cuota
    const montoPorCuota = parseFloat(((venta.total - monto) / cuotas).toFixed(2));

    // Crear el cobro inicial
    const cobroInicial = this.cobrosRepository.create({
      venta,
      monto,
      montoPagado: monto,
      metodoPago: venta.tipo_pago,
      glosa: glosa || 'Monto inicial',
      cobrado: true,
      proximoPago: venta.fecha,
      fechaPago: venta.fecha
    });

    // Actualizar la deuda y cuotas de la venta

    venta.deuda = parseFloat((venta.total - monto).toFixed(2));
    venta.cuotas = cuotas;
    venta.diaPago = dia[diaPago];
    venta.estadoCobro = false;

    // Guardar cobro inicial y la venta actualizada
    await queryRunner.manager.save(cobroInicial);
    await queryRunner.manager.save(venta);

    // Crear cobros para las cuotas
    const cobrosCuotas = [];
    for (let i = 1; i <= cuotas; i++) {
      cobrosCuotas.push(
        this.cobrosRepository.create({
          venta,
          monto: montoPorCuota,
          proximoPago: this.calcularFechaCuota(diaPago, i),
          detalle: `Cuota ${i}`,
          cobrado: false,
        }),
      );
    }

    // Guardar las cuotas
    await queryRunner.manager.save(cobrosCuotas);
  }


  private calcularFechaCuota(diaPago: number, semanas: number): Date {
    const hoy = new Date();
    const diasFaltantes = (7 + diaPago - hoy.getDay()) % 7 || 7;
    hoy.setDate(hoy.getDate() + diasFaltantes + (semanas - 1) * 7);
    return hoy;
  }
}
