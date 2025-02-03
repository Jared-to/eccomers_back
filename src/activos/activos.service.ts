import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActivoDto } from './dto/create-activo.dto';
import { UpdateActivoDto } from './dto/update-activo.dto';
import { Activo } from './entities/activo.entity';
import { CategoriaActivoService } from './service/categoriaActivo.service';

@Injectable()
export class ActivosService {
  constructor(
    @InjectRepository(Activo)
    private readonly activoRepository: Repository<Activo>,

    private readonly categoriaService: CategoriaActivoService,
  ) { }

  // Crear un nuevo activo
  async create(createActivoDto: CreateActivoDto): Promise<Activo> {
    const categoria = await this.categoriaService.findOne(createActivoDto.categoria);

    if (!categoria) {
      throw new NotFoundException('La categoria no Existe.')
    }
    const nuevoActivo = this.activoRepository.create(
      {
        ...createActivoDto,
        fechaVencimiento: createActivoDto.fechaVencimiento ? createActivoDto.fechaVencimiento : null,
        categoria: categoria
      }
    );
    return await this.activoRepository.save(nuevoActivo);
  }

  // Obtener todos los activos
  async findAll(tipo: string): Promise<Activo[]> {

    return await this.activoRepository.find(
      { relations: ['categoria'], where: { tipo: tipo } });

  }

  // Obtener un activo por ID
  async findOne(id: string): Promise<Activo> {
    const activo = await this.activoRepository.findOne({
      where: { id },
      relations: ['categoria'],
    });
    if (!activo) {
      throw new NotFoundException(`Activo con ID ${id} no encontrado.`);
    }
    return activo;
  }

  // Actualizar un activo por ID
  async update(id: string, updateActivoDto: UpdateActivoDto): Promise<Activo> {
    const activo = await this.findOne(id);
    const categoria = await this.categoriaService.findOne(updateActivoDto.categoria);

    if (!activo) {
      throw new NotFoundException('El activo no Existe.')
    }
    if (!categoria) {
      throw new NotFoundException('La categoria no Existe.')
    }
    Object.assign(activo, { ...updateActivoDto, categoria: categoria });
    return await this.activoRepository.save(activo);
  }

  // Eliminar un activo por ID
  async remove(id: string): Promise<void> {
    const activo = await this.findOne(id);
    await this.activoRepository.remove(activo);
  }
}
