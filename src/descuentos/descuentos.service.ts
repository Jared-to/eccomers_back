import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDescuentoDto } from './dto/create-descuento.dto';
import { UpdateDescuentoDto } from './dto/update-descuento.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Descuento } from './entities/descuento.entity';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class DescuentosService {
  constructor(
    @InjectRepository(Descuento)
    private descuentoRepository: Repository<Descuento>,
  ) { }

  // Crear un descuento
  async create(createDescuentoDto: CreateDescuentoDto): Promise<Descuento> {
    const descuento = this.descuentoRepository.create(createDescuentoDto);
    const descuentoGuardado = await this.descuentoRepository.save(descuento);
    // Validar si 'increment' existe, aunque debería ser garantizado por la base de datos
    if (!descuentoGuardado.increment) {
      descuentoGuardado.increment = 1; // En caso de que sea nulo por algún motivo
    }

    // Generar el código basado en el increment
    descuentoGuardado.codigo = `D${descuentoGuardado.increment.toString().padStart(4, '0')}`;

    // Guardar nuevamente el descuento con el código generado
    return this.descuentoRepository.save(descuentoGuardado);
  }

  // Obtener todos los descuentos
  async findAll(): Promise<Descuento[]> {
    return this.descuentoRepository.find();
  }

  // Obtener un descuento por su ID
  async findOne(id: string): Promise<Descuento> {
    const descuento = await this.descuentoRepository.findOne({ where: { id } });
    if (!descuento) {
      throw new NotFoundException(`Descuento con id ${id} no encontrado`);
    }
    return descuento;
  }

  // Actualizar un descuento
  async update(id: string, updateDescuentoDto: UpdateDescuentoDto): Promise<Descuento> {
    const descuento = await this.findOne(id);
    if (!descuento) {
      throw new NotFoundException(`Descuento con id ${id} no encontrado`);
    }

    // Actualiza los campos del descuento
    Object.assign(descuento, updateDescuentoDto);
    return this.descuentoRepository.save(descuento);
  }
  async obtenerDescuentosActivos(): Promise<Descuento[]> {
    const hoy = new Date(); // Fecha actual
    return this.descuentoRepository.find({
      where: {
        estado: true,
        fechaInicio: LessThanOrEqual(hoy), // fechaInicio <= hoy
        fechaFin: MoreThanOrEqual(hoy),     // fechaFin >= hoy
      },
    });
  }

  // Desactivar o activar producto
  async estadoDescuento(id: string) {
    // Busca el producto por ID
    const producto = await this.descuentoRepository.findOne({ where: { id: id } });

    // Si no se encuentra el producto, lanza un error
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // Cambia el estado a 'Inactivo o Activo'
    if (producto.estado) {
      producto.estado = false;
    } else {
      producto.estado = true;
    }

    // Guarda los cambios en la base de datos
    await this.descuentoRepository.save(producto);

    // Devuelve un mensaje de éxito
    return {
      message: 'Descuento desactivado con éxito.',
    };
  }
  // Eliminar un descuento
  async remove(id: string): Promise<void> {
    const descuento = await this.findOne(id);
    if (!descuento) {
      throw new NotFoundException(`Descuento con id ${id} no encontrado`);
    }
    await this.descuentoRepository.remove(descuento);
  }
}
