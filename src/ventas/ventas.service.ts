import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, In } from 'typeorm';
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
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventasRepository: Repository<Venta>,
    @InjectRepository(DetalleVenta)
    private readonly detallesRepository: Repository<DetalleVenta>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(Cobros)
    private readonly cobrosRepository: Repository<Cobros>,
    private readonly inventarioService: InventarioService,
    private readonly movimientosService: MovimientosAlmacenService,
    private readonly authService: AuthService,
    private readonly dataSource: DataSource,

  ) { }

  async create(createVentaDto: CreateVentaDto): Promise<Venta> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { detalles, ventaAlContado, ...ventaData } = createVentaDto;

      // Crear y guardar la venta
      const venta = this.ventasRepository.create({
        ...ventaData,
        vendedor: { id: ventaData.vendedor },
        caja: { id: ventaData.cajaId },
        cliente: { id: ventaData.cliente },
        almacen: { id: ventaData.almacen }
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
      await this.registrarMovimientosInventario(detalles, ventaGuardada.codigo, ventaData.almacen);


      await this.crearCobroContado(queryRunner, ventaGuardada);

      await queryRunner.commitTransaction();
      return this.findOne(ventaGuardada.id);
    } catch (error) {
      console.log(error);
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
      // Buscar la venta existente con sus detalles
      const venta = await this.findOne(id);
      const { detalles, ...ventaData } = updateVentaDto;
      let detallesAEliminar: DetalleVenta[] = [];

      const client = await queryRunner.manager.findOne(Cliente, { where: { id: updateVentaDto.cliente } });

      venta.cliente = client;
      venta.fechaEdit = updateVentaDto.fecha;
      venta.tipo_pago = updateVentaDto.tipo_pago;
      venta.subtotal = updateVentaDto.subtotal;
      venta.total = updateVentaDto.total;

      // Guardar la venta actualizada
      const VG = await queryRunner.manager.save(Venta, venta);

      // Mapear los detalles actuales por ID del producto
      const detallesActualesMap = new Map(
        venta.detalles.map(detalle => [detalle.producto.id, detalle])
      );

      if (venta.almacen.id !== updateVentaDto.almacen) {
        for (const detalle of venta.detalles) {
          // Devolver productos al inventario del almacén anterior
          await this.registrarMovimiento(
            {
              cantidad: detalle.cantidad,
              codigo_barras: detalle.codigo_barras,
              descuento: detalle.descuento,
              precio: detalle.precio,
              id_producto: detalle.producto.id,
              subtotal: detalle.subtotal,
              unidad_medida: detalle.unidad_medida,
            },
            'devolucion',
            `Cambio de Almacén - ${venta.codigo}`,
            venta.almacen.id // Almacén anterior
          );

          // Registrar productos en el nuevo almacén
          await this.registrarMovimiento(
            {
              cantidad: detalle.cantidad,
              codigo_barras: detalle.codigo_barras,
              descuento: detalle.descuento,
              precio: detalle.precio,
              id_producto: detalle.producto.id,
              subtotal: detalle.subtotal,
              unidad_medida: detalle.unidad_medida,
            },
            'venta',
            `Cambio de Almacén - ${venta.codigo}`,
            updateVentaDto.almacen // Nuevo almacén
          );
        }
      } else {

        // Identificar productos modificados o eliminados
        const detallesAModificar = detalles.filter(detalleNuevo => {
          const detalleActual = detallesActualesMap.get(detalleNuevo.id_producto);
          return !detalleActual || detalleActual.cantidad !== detalleNuevo.cantidad;
        });

        // Identificar productos nuevos que antes no estaban
        const productosNuevos = detalles.filter(detalleNuevo =>
          !detallesActualesMap.has(detalleNuevo.id_producto)
        );

        // 1. Devolver al inventario solo los productos cuyo detalle cambió o fue eliminado
        for (const detalleActual of venta.detalles) {
          if (detallesAModificar.some(detalle => detalle.id_producto === detalleActual.producto.id)) {
            detallesAEliminar.push(detalleActual);

            await this.registrarMovimiento(
              {
                cantidad: detalleActual.cantidad,
                codigo_barras: detalleActual.codigo_barras,
                descuento: detalleActual.descuento,
                precio: detalleActual.precio,
                id_producto: detalleActual.producto.id,
                subtotal: detalleActual.subtotal,
                unidad_medida: detalleActual.unidad_medida,
              },
              'devolucion',
              `Ajuste Venta - ${venta.codigo}`,
              ventaData.almacen
            );
          }
        }

        // 2. Agregar nuevos detalles y registrar movimiento
        if (detallesAModificar.length > 0) {
          await this.guardarDetallesVenta(queryRunner, detallesAModificar, VG);
        }
        for (const element of detallesAModificar) {

          await this.registrarMovimiento(
            {
              cantidad: element.cantidad,
              codigo_barras: element.codigo_barras,
              descuento: element.descuento,
              precio: element.precio,
              id_producto: element.id_producto,
              subtotal: element.subtotal,
              unidad_medida: element.unidad_medida,
            },
            'venta',
            `Ajuste Venta - ${venta.codigo}`,
            ventaData.almacen
          );
        }

        // 3. Agregar productos nuevos que antes no existían
        if (productosNuevos.length > 0) {
          await this.guardarDetallesVenta(queryRunner, productosNuevos, VG);
        }

        for (const element of productosNuevos) {

          await this.registrarMovimiento(
            {
              cantidad: element.cantidad,
              codigo_barras: element.codigo_barras,
              descuento: element.descuento,
              precio: element.precio,
              id_producto: element.id_producto,
              subtotal: element.subtotal,
              unidad_medida: element.unidad_medida,
            },
            'venta',
            `Nuevo Producto - ${venta.codigo}`,
            ventaData.almacen
          );
        }
        // 5. Eliminar solo los detalles que cambiaron o fueron eliminados
        if (detallesAEliminar.length > 0) {
          await queryRunner.manager.remove(DetalleVenta, detallesAEliminar);
        }
      }

      await queryRunner.commitTransaction();
      return venta;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  async findAllDates(fechaInicio: string | 'xx', fechaFin: string | 'xx', user: User): Promise<Venta[]> {

    const isAdmin = user.roles.some(role => role === 'admin');
    // Si ambas fechas son 'xx', obtenemos todas las ventas
    if (fechaInicio === 'xx' && fechaFin === 'xx') {

      return this.ventasRepository.find({
        where: isAdmin ? {} : { vendedor: { id: user.id } },
        relations: ['detalles', 'detalles.producto', 'almacen', 'cliente', 'vendedor', 'caja'],
      });

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

    if (!isAdmin) {
      whereConditions.vendedor = { id: user.id };
    }
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
      relations: ['detalles', 'detalles.producto', 'almacen', 'cliente', 'vendedor', 'caja'],
    });

    return ventas;
  }


  async findOne(id: string): Promise<Venta> {
    const venta = await this.ventasRepository.findOne({
      where: { id },
      relations: ['detalles', 'almacen', 'detalles.producto', 'cliente', 'vendedor'],
    });


    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }
    return venta;
  }


  async findOneEdit(id: string): Promise<Venta> {
    const venta = await this.ventasRepository.findOne({
      where: { id },
      relations: ['detalles', 'detalles.producto', 'cliente', 'vendedor', 'cobros', 'almacen'],
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
        .andWhere('i.almacen = :id_almacen', { id_almacen: venta.almacen.id })
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
        relations: ['detalles', 'detalles.producto', 'almacen'],
      });

      if (!venta) {
        throw new NotFoundException(`Venta con ID ${id} no encontrada`);
      }

      // Devolver al inventario los productos de los detalles
      for (const detalle of venta.detalles) {
        await this.registrarMovimiento(
          {

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
          venta.almacen.id
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
  private async registrarMovimiento(detalle: CreateDetalleVentaDto, tipo: string, descripcion: string, almacen: string): Promise<void> {

    if (tipo === 'venta') {
      await this.inventarioService.descontarStock({
        almacenId: almacen,
        cantidad: detalle.cantidad,
        codigo_barras: detalle.codigo_barras,
        productoId: detalle.id_producto,
      });
      await this.movimientosService.registrarSalida({
        almacenId: almacen,
        cantidad: detalle.cantidad,
        productoId: detalle.id_producto,
        descripcion: descripcion,
        codigo_barras: detalle.codigo_barras,
      });
    } else {
      await this.inventarioService.agregarStock({
        almacenId: almacen,
        cantidad: detalle.cantidad,
        codigo_barras: detalle.codigo_barras,
        productoId: detalle.id_producto,
      });
      await this.movimientosService.registrarIngreso({
        almacenId: almacen,
        cantidad: detalle.cantidad,
        productoId: detalle.id_producto,
        descripcion: descripcion,
        codigo_barras: detalle.codigo_barras,
      });
    }
  }

  private async guardarDetallesVenta(queryRunner, detalles: CreateDetalleVentaDto[], venta: Venta): Promise<void> {


    for (const detalle of detalles) {
      const producto = await this.productoRepository.findOne({ where: { id: detalle.id_producto } });

      if (!producto) {
        throw new NotFoundException('Producto  no encontrado');
      }

      const detalleVenta = queryRunner.manager.create(DetalleVenta, {
        ...detalle,
        producto,
        venta,
      });
      await queryRunner.manager.save(DetalleVenta, detalleVenta);
    }
  }

  private async registrarMovimientosInventario(detalles, codigoVenta: string, almacenID: string): Promise<void> {
    await Promise.all(
      detalles.map(detalle =>
        this.registrarMovimiento(detalle, 'venta', `Venta-${codigoVenta}`, almacenID),
      ),
    );
  }

  private async crearCobroContado(queryRunner, venta: Venta): Promise<void> {
    const cobro = this.cobrosRepository.create({
      venta,
      monto: venta.total,
      metodoPago: venta.tipo_pago,
    });
    venta.estadoCobro = true;
    venta.ventaAlContado = true;
    await queryRunner.manager.save(cobro);
    await queryRunner.manager.save(venta);
  }

}
