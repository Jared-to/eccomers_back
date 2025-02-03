import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateTraspasoDto } from './dto/create-traspaso.dto';
import { UpdateTraspasoDto } from './dto/update-traspaso.dto';
import { DataSource, Repository } from 'typeorm';
import { Traspaso } from './entities/traspaso.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Almacen } from 'src/almacenes/entities/almacen.entity';
import { NotFoundError } from 'rxjs';
import { InventarioService } from 'src/inventario/inventario.service';
import { Inventario } from 'src/inventario/entities/inventario.entity';
import { DetalleTraspaso } from './entities/detalleTraspaso.entity';
import { MovimientosAlmacenService } from 'src/inventario/service/movimientos-almacen.service';

@Injectable()
export class TraspasosService {
  constructor(
    @InjectRepository(Traspaso)
    private readonly traspasoRepository: Repository<Traspaso>,
    private readonly dataSource: DataSource,
    private readonly inventarioService: InventarioService,
    private readonly movimientosService: MovimientosAlmacenService,

  ) { }
  async create(createTraspasoDto: CreateTraspasoDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { detalles, almacenDestino, almacenOrigen, fecha, glosa, user } = createTraspasoDto;

      // Buscar almacenes
      const almaceOrigen = await queryRunner.manager.findOne(Almacen, { where: { id: almacenOrigen } });
      const almaceDestino = await queryRunner.manager.findOne(Almacen, { where: { id: almacenDestino } });

      if (!almaceOrigen || !almaceDestino) {
        throw new NotFoundException('No se encuentra el Almacén');
      }

      // Crear el traspaso, pero aún no guardar los detalles
      const traspasoNuevo = queryRunner.manager.create(Traspaso, {
        responsable: { id: user },
        almacenOrigen: almaceOrigen,
        almacenDestino: almaceDestino,
        fecha,
        glosa,
      });

      // Guardar el traspaso para obtener el ID
      const traspasoGuardado = await queryRunner.manager.save(Traspaso, traspasoNuevo);

      // Procesar los detalles
      for (const element of detalles) {
        const inventario = await queryRunner.manager.findOne(Inventario, {
          where: { id: element.id_inventario },
          relations: ['product'],
        });

        if (!inventario) {
          throw new NotFoundException('No se encontró el inventario');
        }

        // Registrar stocks y movimientos
        await this.inventarioService.agregarStockTransactional({
          almacenId: almaceDestino.id,
          cantidad: element.cantidad,
          codigo_barras: inventario.codigo_barras,
          productoId: inventario.product.id,
        }, queryRunner);

        await this.movimientosService.registrarIngresoTransaccion({
          almacenId: almaceDestino.id,
          cantidad: element.cantidad,
          codigo_barras: inventario.codigo_barras,
          productoId: inventario.product.id,
          descripcion: 'Traslado',
        }, queryRunner);

        await this.inventarioService.descontarStockTransactional({
          almacenId: almaceOrigen.id,
          cantidad: element.cantidad,
          codigo_barras: inventario.codigo_barras,
          productoId: inventario.product.id,
        }, queryRunner);

        await this.movimientosService.registrarSalidaTransaccion({
          almacenId: almaceOrigen.id,
          cantidad: element.cantidad,
          codigo_barras: inventario.codigo_barras,
          productoId: inventario.product.id,
          descripcion: 'Traslado',
        }, queryRunner);

        // Crear detalles relacionados al traspaso guardado
        const detalleTraspaso = queryRunner.manager.create(DetalleTraspaso, {
          inventario,
          cantidad: element.cantidad,
          traspaso: traspasoGuardado, // Usar el traspaso guardado con ID
        });

        await queryRunner.manager.save(DetalleTraspaso, detalleTraspaso);
      }

      await queryRunner.commitTransaction(); // Confirmar la transacción
    } catch (error) {
      console.error(error);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('No se pudo crear el traspaso');
    } finally {
      await queryRunner.release(); // Liberar el QueryRunner
    }
  }


  async findAll(): Promise<Traspaso[]> {
    try {
      return await this.dataSource.getRepository(Traspaso).find({
        relations: ['almacenOrigen', 'almacenDestino', 'detalles', 'responsable'],
      });
    } catch (error) {
      throw new InternalServerErrorException(`No se pudieron obtener los traspasos: ${error.message}`);
    }
  }


  async findOne(id: string): Promise<Traspaso> {
    try {
      const traspaso = await this.dataSource.getRepository(Traspaso).findOne({
        where: { id },
        relations: ['almacenOrigen', 'almacenDestino', 'detalles', 'detalles.inventario', 'detalles.inventario.product', 'detalles.inventario.product.categoria'],
      });

      if (!traspaso) {
        throw new NotFoundException(`El traspaso con ID ${id} no existe`);
      }

      return traspaso;
    } catch (error) {
      throw new InternalServerErrorException(`Error al obtener el traspaso con ID ${id}: ${error.message}`);
    }
  }

  async update(id: string, updateTraspasoDto: UpdateTraspasoDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { detalles, almacenDestino, almacenOrigen, fecha, glosa } = updateTraspasoDto;

      // Buscar el traspaso existente
      const traspasoExistente = await queryRunner.manager.findOne(Traspaso, {
        where: { id },
        relations: ['detalles', 'detalles.inventario', 'almacenOrigen', 'almacenDestino'],
      });

      if (!traspasoExistente) {
        throw new NotFoundException(`El traspaso con ID ${id} no existe`);
      }

      // Buscar almacenes
      const almaceOrigen = await queryRunner.manager.findOne(Almacen, { where: { id: almacenOrigen } });
      const almaceDestino = await queryRunner.manager.findOne(Almacen, { where: { id: almacenDestino } });

      if (!almaceOrigen) {
        throw new NotFoundException(`El almacén origen con ID ${almacenOrigen} no existe`);
      }
      if (!almaceDestino) {
        throw new NotFoundException(`El almacén destino con ID ${almacenDestino} no existe`);
      }

      // Restaurar los stocks de los detalles antiguos
      for (const detalle of traspasoExistente.detalles) {
        console.log(detalle);

        const inventario = await queryRunner.manager.findOne(Inventario, {
          where: { id: detalle.inventario.id },
          relations: ['product'],
        });

        if (inventario) {
          await this.inventarioService.agregarStockTransactional({
            almacenId: traspasoExistente.almacenOrigen.id,
            cantidad: detalle.cantidad,
            codigo_barras: inventario.codigo_barras,
            productoId: inventario.product.id,
          }, queryRunner);



          await this.inventarioService.descontarStockTransactional({
            almacenId: traspasoExistente.almacenDestino.id,
            cantidad: detalle.cantidad,
            codigo_barras: inventario.codigo_barras,
            productoId: inventario.product.id,
          }, queryRunner);

        }
      }

      // Actualizar los datos principales del traspaso
      traspasoExistente.almacenOrigen = almaceOrigen;
      traspasoExistente.almacenDestino = almaceDestino;
      traspasoExistente.fecha = fecha;
      traspasoExistente.glosa = glosa;

      await queryRunner.manager.save(Traspaso, traspasoExistente);

      // Eliminar los detalles antiguos
      await queryRunner.manager.delete(DetalleTraspaso, { traspaso: { id } });

      // Procesar los nuevos detalles
      for (const element of detalles) {
        const inventario = await queryRunner.manager.findOne(Inventario, {
          where: { id: element.id_inventario },
          relations: ['product'],
        });

        //detalle anterior
        const detalleAnterior = traspasoExistente.detalles.find(detalle => detalle.inventario.id === element.id_inventario)
        if (!inventario) {
          throw new NotFoundException(`El inventario con ID ${element.id_inventario} no existe`);
        }

        // Actualizar stocks
        await this.inventarioService.agregarStockTransactional({
          almacenId: almaceDestino.id,
          cantidad: element.cantidad,
          codigo_barras: inventario.codigo_barras,
          productoId: inventario.product.id,
        }, queryRunner);
        if (detalleAnterior) {
          //registrar movimiento
          await this.movimientosService.registrarIngresoTransaccion({
            almacenId: almaceDestino.id,
            cantidad: element.cantidad - detalleAnterior.cantidad,
            codigo_barras: inventario.codigo_barras,
            productoId: inventario.product.id,
            descripcion: 'Traslado Editado'
          }, queryRunner)
        } else {
          await this.movimientosService.registrarIngresoTransaccion({
            almacenId: almaceDestino.id,
            cantidad: element.cantidad,
            codigo_barras: inventario.codigo_barras,
            productoId: inventario.product.id,
            descripcion: 'Traslado Editado'
          }, queryRunner)
        }

        await this.inventarioService.descontarStockTransactional({
          almacenId: almaceOrigen.id,
          cantidad: element.cantidad,
          codigo_barras: inventario.codigo_barras,
          productoId: inventario.product.id,
        }, queryRunner);
        if (detalleAnterior) {
          //registrar movimiento salida
          await this.movimientosService.registrarSalidaTransaccion({
            almacenId: almaceOrigen.id,
            cantidad: element.cantidad - detalleAnterior.cantidad,
            codigo_barras: inventario.codigo_barras,
            productoId: inventario.product.id,
            descripcion: 'Traslado Editado'
          }, queryRunner)
        } else {
          //registrar movimiento salida
          await this.movimientosService.registrarSalidaTransaccion({
            almacenId: almaceOrigen.id,
            cantidad: element.cantidad,
            codigo_barras: inventario.codigo_barras,
            productoId: inventario.product.id,
            descripcion: 'Traslado Editado'
          }, queryRunner)
        }

        // Crear nuevo detalle
        const detalleTraspaso = queryRunner.manager.create(DetalleTraspaso, {
          ...element,
          inventario: { id: inventario.id },
          traspaso: { id: traspasoExistente.id },
        });
        await queryRunner.manager.save(DetalleTraspaso, detalleTraspaso);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      console.log(error);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`No se pudo actualizar el traspaso: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const traspaso = await queryRunner.manager.findOne(Traspaso, {
        where: { id },
        relations: ['detalles', 'detalles.inventario', 'detalles.inventario.product', 'almacenOrigen', 'almacenDestino'],
      });

      if (!traspaso) {
        throw new NotFoundException(`El traspaso con ID ${id} no existe`);
      }

      // Restaurar stocks de los detalles
      for (const detalle of traspaso.detalles) {
        const inventario = detalle.inventario;

        if (inventario) {
          await this.inventarioService.agregarStockTransactional({
            almacenId: traspaso.almacenOrigen.id,
            cantidad: detalle.cantidad,
            codigo_barras: inventario.codigo_barras,
            productoId: inventario.product.id,
          }, queryRunner);
          //registrar movimiento ingreso
          await this.movimientosService.registrarIngresoTransaccion({
            almacenId: traspaso.almacenOrigen.id,
            cantidad: detalle.cantidad,
            codigo_barras: inventario.codigo_barras,
            productoId: inventario.product.id,
            descripcion: 'Traslado Eliminado'
          }, queryRunner)

          await this.inventarioService.descontarStockTransactional({
            almacenId: traspaso.almacenDestino.id,
            cantidad: detalle.cantidad,
            codigo_barras: inventario.codigo_barras,
            productoId: inventario.product.id,
          }, queryRunner);
          //registrar movimiento salida
          await this.movimientosService.registrarSalidaTransaccion({
            almacenId: traspaso.almacenDestino.id,
            cantidad: detalle.cantidad,
            codigo_barras: inventario.codigo_barras,
            productoId: inventario.product.id,
            descripcion: 'Traslado Eliminado'
          }, queryRunner)
        }
      }

      // Eliminar los detalles
      await queryRunner.manager.delete(DetalleTraspaso, { traspaso: { id } });

      // Eliminar el traspaso
      await queryRunner.manager.delete(Traspaso, { id });

      await queryRunner.commitTransaction();
    } catch (error) {
      console.log(error);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`No se pudo eliminar el traspaso con ID ${id}: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

}
