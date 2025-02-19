import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Categoria } from './entities/categoria.entity';
import { Repository } from 'typeorm';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    private readonly cloudinaryService: CloudinaryService,

  ) { }
  // Crear una categoría
  async createCategoria(createCategoriaDto: CreateCategoriaDto, file?: Express.Multer.File): Promise<Categoria> {
    let imagesUrl;
    const categoria = this.categoriaRepository.create(createCategoriaDto);

    if (!file) {
      imagesUrl = 'https://res.cloudinary.com/dhdxemsr1/image/upload/v1739824019/mczqepjigy8vf61khwtt.png';
    } else {
      // Subir imágenes a Cloudinary
      const uploadPromises = await this.cloudinaryService.uploadFile(file);
      imagesUrl = uploadPromises.secure_url;
      console.log('Resultado de Cloudinary:', uploadPromises);
    }
    categoria.image = imagesUrl;
    return await this.categoriaRepository.save(categoria);
  }

  // Editar una categoría
  async updateCategoria(id: string, updateCategoriaDto: UpdateCategoriaDto, file?: Express.Multer.File): Promise<Categoria> {
    const categoria = await this.categoriaRepository.preload({
      id,
      ...updateCategoriaDto,
    });

    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    let finalImage = categoria.image;
    if (file) {
      // Eliminar imágenes anteriores de Cloudinary
      if (categoria.image !== 'https://res.cloudinary.com/dhdxemsr1/image/upload/v1739824019/mczqepjigy8vf61khwtt.png') {
        const publicId = this.extractPublicId(categoria.image);
        await this.cloudinaryService.deleteFile(publicId); // Eliminar de Cloudinary
      }
      // cargar nuevas imagenes
      const uploadPromises = await this.cloudinaryService.uploadFile(file);
      finalImage = uploadPromises.secure_url;

    }
    categoria.image = finalImage;


    return await this.categoriaRepository.save(categoria);
  }

  // Traer todas las categorías
  async findAllCategorias(): Promise<Categoria[]> {
    return await this.categoriaRepository.find({ relations: ['productos'] }); // Incluye los productos
  }

  // Traer todas las categorías
  async findAllCategoriasPublicas(): Promise<Categoria[]> {
    return await this.categoriaRepository.find({ where: { estado: true } });
  }
  // Traer una categoría específica
  async findOneCategoria(id: string): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOne({
      where: { id },
      relations: ['productos'], // Incluye los productos relacionados
    });

    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    return categoria;
  }
  //cambiar estado
  async isStatusCategoria(id: string) {
    const categoria = await this.findOneCategoria(id);
    categoria.estado = !categoria.estado;

    return this.categoriaRepository.save(categoria);
  }
  //eliminar categoria
  async remove(id: string): Promise<void> {

    const categoria = await this.findOneCategoria(id);
    if (categoria.image !== 'https://res.cloudinary.com/dhdxemsr1/image/upload/v1739824019/mczqepjigy8vf61khwtt.png') {
      const publicId = this.extractPublicId(categoria.image);
      await this.cloudinaryService.deleteFile(publicId); // Eliminar de Cloudinary
    }

    await this.categoriaRepository.remove(categoria);
  }

  private extractPublicId(url: string): string {
    const parts = url.split('/');
    const fileWithExtension = parts[parts.length - 1];
    return fileWithExtension.split('.')[0]; // Elimina la extensión para obtener el public_id
  }
}