import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { ActivosService } from "../activos.service";
import { CreateRegistroDto } from "../dto/registrar-registro.dto";
import { MovimientosActivos } from "../entities/movimientos-activos.entity";


@Injectable()
export class MovimientosActivosService {
  constructor(
    @InjectRepository(MovimientosActivos)
    private readonly movimientosActivos: Repository<MovimientosActivos>,
    private readonly activosService: ActivosService
  ) { }

  async registrar(id_activo: string, registroDto: CreateRegistroDto) {
    const { cantidad, glosa, tipo, fecha, user } = registroDto;

    // Buscar activo
    const activo = await this.activosService.findOne(id_activo);
    if (!activo) {
      throw new NotFoundException('Activo no encontrado');
    }

    // Validar tipo de operación
    if (tipo === 'ingreso') {
      // Aumentar cantidad
      activo.cantidad += cantidad;
    } else if (tipo === 'egreso') {
      // Validar que la cantidad a restar no exceda la disponible
      if (activo.cantidad < cantidad) {
        throw new BadRequestException('La cantidad a egresar excede la cantidad disponible');
      }
      activo.cantidad -= cantidad;
    } else {
      throw new BadRequestException('Tipo de operación inválido');
    }

    // Guardar cambios en el activo
    await this.activosService.update(activo.id, { cantidad: activo.cantidad });

    // Crear el nuevo registro
    const registroNuevo = this.movimientosActivos.create({
      ...registroDto,
      user: { id: user },
      activo: { id: activo.id }, // Relación con el activo
    });

    // Guardar y devolver el registro
    return await this.movimientosActivos.save(registroNuevo);
  }

  async obtenerMovimientos(id_activo: string) {
    return await this.movimientosActivos.find({
      where: { activo: { id: id_activo } },
      relations:['user']
    })
  }
  async obtenerMovimientosPorRangoFechas(id_activo: string, fechaInicio: Date, fechaFin: Date) {
    return await this.movimientosActivos.find({
      where: {
        activo: { id: id_activo },
        fecha: Between(fechaInicio, fechaFin),
      },
      relations:['user']
    });
  }


}