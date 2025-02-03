import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Not, Repository } from "typeorm";
import { CreateCobroDto } from "../dto/create-cobro.dto";
import { Cobros } from "../entities/cobros.entity";
import { Venta } from "../entities/venta.entity";
import { User } from "src/auth/entities/user.entity";


@Injectable()
export class CuotasService {
  constructor(
    @InjectRepository(Cobros)
    private readonly cobrosRepository: Repository<Cobros>,
    private readonly dataSource: DataSource,

  ) { }

  async createCobro(createCobroDto: CreateCobroDto): Promise<Cobros> {
    const { monto, glosa, metodoPago, ventaId, cobrador } = createCobroDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar la venta asociada usando el id de la venta
      const ventaEncontrada = await queryRunner.manager.findOne(Venta, {
        where: { id: ventaId },
      });
      const cobradorV = await queryRunner.manager.findOne(User, {
        where: { id: cobrador },
      });

      if (!ventaEncontrada) {
        throw new NotFoundException('Venta no encontrada');
      }

      // Verificar si el cobro ya está completado
      if (ventaEncontrada.estadoCobro) {
        throw new BadRequestException(
          'El cobro ya ha sido completado. No se pueden realizar más pagos.',
        );
      }

      // Validar que el monto no exceda la deuda total
      if (monto > ventaEncontrada.deuda) {
        throw new BadRequestException(
          `El monto a pagar (${monto}) no puede ser mayor al monto por cobrar (${ventaEncontrada.deuda}).`,
        );
      }

      // Buscar el cobro pendiente más cercano
      let cobroPendiente = await queryRunner.manager.findOne(Cobros, {
        where: { cobrado: false, venta: { id: ventaEncontrada.id } },
        order: { proximoPago: 'ASC' },
      });
      console.log(cobroPendiente);
      console.log(ventaEncontrada);


      // Si no hay cobro pendiente, crear uno nuevo
      if (!cobroPendiente) {
        cobroPendiente = queryRunner.manager.create(Cobros, {
          monto: ventaEncontrada.deuda,
          montoPagado: 0,
          glosa: '',
          metodoPago: metodoPago,
          venta: ventaEncontrada,
          proximoPago: new Date(),
          cobrado: false,
          vendedor: cobradorV,
        });
        await queryRunner.manager.save(Cobros, cobroPendiente);
      }

      // Manejar el monto pagado
      cobroPendiente.montoPagado = monto;
      cobroPendiente.glosa = glosa;
      cobroPendiente.fechaPago = new Date();
      cobroPendiente.vendedor = cobradorV;
      cobroPendiente.metodoPago = metodoPago;
      console.log(cobroPendiente.montoPagado, cobroPendiente.monto);

      if (cobroPendiente.montoPagado >= cobroPendiente.monto) {
        // Si se paga más del monto esperado
        cobroPendiente.cobrado = true;

        const exceso = cobroPendiente.montoPagado - cobroPendiente.monto;

        // Ajustar el próximo cobro si hay exceso
        if (exceso > 0) {
          let excesoRestante = exceso;

          // Buscar todos los cobros pendientes de la venta
          const cobrosPendientes = await queryRunner.manager.find(Cobros, {
            where: { cobrado: false, venta: { id: ventaEncontrada.id }, id: Not(cobroPendiente.id) },
            order: { proximoPago: 'ASC' },
          });

          // Iterar sobre los cobros pendientes
          for (const siguienteCobro of cobrosPendientes) {
            const nuevoMonto = siguienteCobro.monto - excesoRestante;

            if (nuevoMonto <= 0) {
              // Eliminar el cobro si el monto ha sido completamente cubierto
              excesoRestante = Math.abs(nuevoMonto); // Lo que sobra después de cubrir este cobro
              await queryRunner.manager.remove(Cobros, siguienteCobro);
            } else {
              // Actualizar el monto del cobro si no se cubre completamente
              siguienteCobro.monto = nuevoMonto;
              await queryRunner.manager.save(Cobros, siguienteCobro);
              excesoRestante = 0;
            }

            // Si no queda exceso, no es necesario seguir iterando
            if (excesoRestante === 0) {
              break;
            }
          }

          // Si la deuda de la venta ya está completamente saldada, eliminar los cobros restantes
          if (ventaEncontrada.deuda <= 0) {
            await queryRunner.manager.delete(Cobros, { venta: { id: ventaEncontrada.id }, cobrado: false });
          }
        }



      } else {
        cobroPendiente.cobrado = true;
      }

      await queryRunner.manager.save(Cobros, cobroPendiente);

      // Actualizar la deuda de la venta
      ventaEncontrada.deuda -= monto;

      if (ventaEncontrada.deuda === 0) {
        ventaEncontrada.estadoCobro = true;
      }

      // Incrementar cuotaActual si no se ha completado el cobro
      if (!ventaEncontrada.estadoCobro) {
        ventaEncontrada.cuotaActual += 1;
      }

      // Guardar la venta actualizada
      await queryRunner.manager.save(Venta, ventaEncontrada);

      // Commit de la transacción
      await queryRunner.commitTransaction();

      // Retornar el cobro actualizado o creado
      return cobroPendiente;
    } catch (error) {
      // Si ocurre un error, hacer rollback de la transacción
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar el queryRunner
      await queryRunner.release();
    }
  }

  async getCobrosPorVenta(ventaId: string): Promise<any> {
    try {
      // Buscar la venta junto con los cobros asociados
      const venta = await this.dataSource.getRepository(Venta).findOne({
        where: { id: ventaId },
        relations: ['cobros', 'vendedor'],
      });

      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }

      // Obtener los pagos de la venta
      const pagos = venta.cobros.map((cobro) => ({
        id: cobro.id,
        proximoPago: cobro.proximoPago,
        monto: cobro.monto,
        porcentaje: cobro.porcentaje,
        glosa: cobro.glosa,
        metodoPago: cobro.metodoPago,
        fechaPago: cobro.fechaPago,
        diaCobranza: cobro.diaPago,
        estado: cobro.cobrado,
        fechaProxPago: cobro.proximoPago,
        detalle: cobro.detalle,
        montoPagado: cobro.montoPagado
      }));

      // Construir la respuesta con los pagos y las propiedades de la venta
      return {
        pagos,
        vendedor: venta.vendedor,
        codigoVenta: venta.codigo,
        diaCobranza: venta.diaPago,
        estadoPago: venta.estadoCobro,
        totalVenta: venta.total,
        montoPorPagar: venta.deuda,
        cuotas: venta.cuotas,
        cuotaActual: venta.cuotaActual,
      };
    } catch (error) {
      throw new Error(
        `Error al obtener los cobros de la venta: ${error.message}`,
      );
    }
  }
}