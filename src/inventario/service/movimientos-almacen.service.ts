import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { MovimientoInventario } from '../entities/movimiento-inv';
import { MovimientoInventarioDto } from '../dto/movimiento-inv.dto';
import { ProductosService } from 'src/productos/productos.service';
import { AlmacenesService } from 'src/almacenes/almacenes.service';
import { Almacen } from 'src/almacenes/entities/almacen.entity';

@Injectable()
export class MovimientosAlmacenService {
  constructor(
    @InjectRepository(MovimientoInventario)
    private readonly movimientoRepository: Repository<MovimientoInventario>,
    private readonly almacenService: AlmacenesService
  ) { }

  // Registrar un ingreso
  async registrarIngreso(movimientoInventarioDto: MovimientoInventarioDto): Promise<MovimientoInventario> {

    const { almacenId, cantidad, productoId, descripcion } = movimientoInventarioDto;
    const fechaUTC = new Date()
    const almacen = await this.almacenService.findOne(almacenId);
    const movimiento = this.movimientoRepository.create({
      almacen: almacen,
      product: { id: productoId },
      tipo: 'ingreso',
      cantidad,
      descripcion,
      fecha: fechaUTC,
      codigo_barras: movimientoInventarioDto.codigo_barras
    });

    return this.movimientoRepository.save(movimiento);
  }
  //Registro con ingreso con transaccion
  async registrarIngresoTransaccion(
    movimientoInventarioDto: MovimientoInventarioDto,
    queryRunner: QueryRunner
  ): Promise<MovimientoInventario> {

    const { almacenId, cantidad, productoId, descripcion, codigo_barras } = movimientoInventarioDto;
    const fechaUTC = new Date();

    // Busca el almacén usando el QueryRunner
    const almacen = await queryRunner.manager.findOne(Almacen, { where: { id: almacenId } });

    if (!almacen) {
      throw new Error(`El almacén con ID ${almacenId} no existe.`);
    }

    const movimiento = queryRunner.manager.create(MovimientoInventario, {
      almacen: almacen,
      product: { id: productoId }, // Asegúrate de que el producto exista también en la misma transacción
      tipo: 'ingreso',
      cantidad,
      descripcion,
      fecha: fechaUTC,
      codigo_barras,
    });

    // Guarda el movimiento usando el QueryRunner
    return queryRunner.manager.save(MovimientoInventario, movimiento);
  }

  // Registrar una salida
  async registrarSalida(movimientoInventarioDto: MovimientoInventarioDto): Promise<MovimientoInventario> {

    const { almacenId, cantidad, productoId, descripcion } = movimientoInventarioDto;
    const fechaLocal = new Date();

    const movimiento = this.movimientoRepository.create({
      almacen: { id: almacenId },
      product: { id: productoId },
      tipo: 'salida',
      cantidad,
      descripcion,
      fecha: fechaLocal,
      codigo_barras: movimientoInventarioDto.codigo_barras
    });

    return this.movimientoRepository.save(movimiento);
  }

  // Registrar una salida
  async registrarSalidaTransaccion(
    movimientoInventarioDto: MovimientoInventarioDto,
    queryRunner: QueryRunner
  ): Promise<MovimientoInventario> {

    const { almacenId, cantidad, productoId, descripcion } = movimientoInventarioDto;
    const fechaLocal = new Date();

    const movimiento = queryRunner.manager.create(MovimientoInventario, {
      almacen: { id: almacenId },
      product: { id: productoId },
      tipo: 'salida',
      cantidad,
      descripcion,
      fecha: fechaLocal,
      codigo_barras: movimientoInventarioDto.codigo_barras
    });

    return queryRunner.manager.save(MovimientoInventario, movimiento);
  }
  // Obtener todos los movimientos
  async obtenerMovimientos(): Promise<MovimientoInventario[]> {
    return this.movimientoRepository.find({ order: { fecha: 'DESC' } });
  }

  // Obtener movimientos por almacén
  async obtenerMovimientosPorAlmacen(almacenId: string): Promise<MovimientoInventario[]> {
    return this.movimientoRepository.find({
      where: { almacen: { id: almacenId } },
      order: { fecha: 'DESC' },
    });
  }

  // Obtener movimientos por producto
  async obtenerMovimientosPorProducto(
    productoId: string,
    fechaIn?: string,
    fechaFn?: string,
  ) {
    const queryBuilder = this.movimientoRepository.createQueryBuilder('movimiento');

    // Filtrar por producto_id 
    queryBuilder
      .leftJoinAndSelect('movimiento.almacen', 'almacen') // Incluir relación con almacén
      .where('movimiento.product = :productoId', { productoId });
    // .andWhere('movimiento.codigo_barras = :codigo_barras', { codigo_barras });

    // Filtrar por rango de fechas si se pasan
    if (fechaIn && fechaFn) {
      // Asegurarse de que las fechas estén en el formato correcto (ej. 'YYYY-MM-DD')
      queryBuilder.andWhere('movimiento.fecha BETWEEN :fechaIn AND :fechaFn', {
        fechaIn: fechaIn + 'T00:00:00',  // Incluir inicio del día
        fechaFn: fechaFn + 'T23:59:59',  // Incluir fin del día
      });
    }

    // Ejecutar la consulta
    const movimientos = await queryBuilder.getMany();

    return movimientos;
  }



}
