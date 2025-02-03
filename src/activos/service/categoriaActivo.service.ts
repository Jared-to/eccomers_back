import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaActivo } from '../entities/categoria.entity';
import { CreateCategoriaActivoDto } from '../dto/createCategoria.dto';

@Injectable()
export class CategoriaActivoService {
  constructor(
    @InjectRepository(CategoriaActivo)
    private readonly categoriaActivoRepository: Repository<CategoriaActivo>,
  ) {}

  // Crear una nueva categoría de activo
  async create(createCategoriaActivoDto: CreateCategoriaActivoDto): Promise<CategoriaActivo> {
    const nuevaCategoria = this.categoriaActivoRepository.create(createCategoriaActivoDto);
    return await this.categoriaActivoRepository.save(nuevaCategoria);
  }

  // Obtener todas las categorías de activos
  async findAll(): Promise<CategoriaActivo[]> {
    
    return await this.categoriaActivoRepository.find({ relations: ['activo'] });
  }

  // Obtener una categoría por ID
  async findOne(id: string): Promise<CategoriaActivo> {
    const categoria = await this.categoriaActivoRepository.findOne({
      where: { id },
      relations: ['activo'],
    });
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada.`);
    }
    return categoria;
  }

  // Actualizar una categoría por ID
  async update(id: string, updateCategoriaActivoDto: CreateCategoriaActivoDto): Promise<CategoriaActivo> {
    const categoria = await this.findOne(id);
    Object.assign(categoria, updateCategoriaActivoDto);
    return await this.categoriaActivoRepository.save(categoria);
  }

  // Eliminar una categoría por ID
  async remove(id: string): Promise<void> {
    const categoria = await this.findOne(id);
    await this.categoriaActivoRepository.remove(categoria);
  }
}
