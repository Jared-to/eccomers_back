import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Categoria } from 'src/categorias/entities/categoria.entity';
import { QueryRunner, Repository } from 'typeorm';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { VarianteProducto } from './entities/varianteProducto.entity';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,

    @InjectRepository(VarianteProducto)
    private readonly varianteProductoRepository: Repository<VarianteProducto>,

    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,

    private readonly cloudinaryService: CloudinaryService,
  ) { }

  // Crear un producto
  async createProducto(createProductoDto: CreateProductoDto, file?: Express.Multer.File): Promise<Producto> {
    const { categoriaId, variantes, ...productoData } = createProductoDto;

    let imagesUrl
    try {
      const categoria = await this.categoriaRepository.findOne({ where: { id: categoriaId } });
      if (!categoria) {
        throw new NotFoundException(`Categoría con ID ${categoriaId} no encontrada`);
      }
      if (!file) {
        imagesUrl = 'https://res.cloudinary.com/dsuvpnp9u/image/upload/v1736440720/tli4lpfen5fucruno3l2.jpg';
      } else {
        // Subir imágenes a Cloudinary
        const uploadPromises = await this.cloudinaryService.uploadFile(file);
        imagesUrl = uploadPromises.secure_url;
        console.log('Resultado de Cloudinary:', uploadPromises);
      }

      const producto = this.productoRepository.create({
        ...productoData,
        imagen: imagesUrl || null,
        categoria,
      });
      const productoGuardado = await this.productoRepository.save(producto);


      if (variantes && variantes.length > 0) {
        const variantesEntities = variantes.map((variante) =>
          this.varianteProductoRepository.create({ ...variante, producto: productoGuardado }),
        );
        await this.varianteProductoRepository.save(variantesEntities);
        productoGuardado.variantes = variantesEntities;
      }
      // Generar el código basado en el increment
      productoGuardado.codigo = `P${productoGuardado.increment.toString().padStart(4, '0')}`;

      // Guardar nuevamente el producto con el código generado
      return this.productoRepository.save(productoGuardado);
    } catch (error) {
      throw new Error(`Error al guardar el producto: ${error.message}`);
    }
  }

  // Editar un producto
  async updateProducto(
    id: string,
    updateProductoDto: UpdateProductoDto,
    file?: Express.Multer.File
  ): Promise<Producto> {
    const { categoriaId, variantes, ...productoData } = updateProductoDto;

    try {
      // Verificar si el producto existe
      let producto = await this.productoRepository.findOne(
        { where: { id }, relations: ['categoria', 'variantes'], },
      );
      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      // Verificar si la categoría debe ser actualizada
      let categoria = producto.categoria;
      if (categoriaId) {
        categoria = await this.categoriaRepository.findOne({ where: { id: categoriaId } });
        if (!categoria) {
          throw new NotFoundException(`Categoría con ID ${categoriaId} no encontrada`);
        }
      }
      let finalImage = null;
      // 1. Eliminar las imágenes antiguas de Cloudinary y BD si es necesario
      if (file) {
        // Eliminar imágenes anteriores de Cloudinary

        if (producto.imagen !== 'https://res.cloudinary.com/dsuvpnp9u/image/upload/v1736440720/tli4lpfen5fucruno3l2.jpg') {
          const publicId = this.extractPublicId(producto.imagen);
          await this.cloudinaryService.deleteFile(publicId); // Eliminar de Cloudinary
        }
        // cargar nuevas imagenes
        const uploadPromises = await this.cloudinaryService.uploadFile(file);
        finalImage = uploadPromises.secure_url;
      }

      // Actualizar los datos básicos del producto
      Object.assign(producto, productoData);

      const productoG = await this.productoRepository.save(producto);
      // 🔥 Comparación inteligente de variantes 🔥
      if (variantes && variantes.length > 0) {
        const variantesActuales = producto.variantes; // Variantes en BD

        const variantesAEliminar = [];
        const variantesAActualizar = [];

        // 1️⃣ Verificar cuáles deben actualizarse o eliminarse
        for (const actual of variantesActuales) {
          const encontrada = variantes.find((v) => v.nombre === actual.nombre);
          if (encontrada) {
            if (actual.precio !== encontrada.precio) {
              console.log('Actualizando variante:', actual, 'Nuevo:', encontrada);
              actual.precio = encontrada.precio;
              variantesAActualizar.push(actual); // Marcar para actualización
            }
          } else {
            console.log('A eliminar:', actual);
            variantesAEliminar.push(actual);
          }
        }

        // 2️⃣ Eliminar variantes que ya no están en la nueva lista
        if (variantesAEliminar.length > 0) {
          await this.varianteProductoRepository.remove(variantesAEliminar);
          await this.varianteProductoRepository.delete(variantesAEliminar.map((v) => v.id));
        }

        // **Actualizar la relación en memoria**
        producto.variantes = producto.variantes.filter(
          (v) => !variantesAEliminar.some((eliminar) => eliminar.id === v.id)
        );

        // 3️⃣ Actualizar variantes que cambiaron de precio
        if (variantesAActualizar.length > 0) {
          await this.varianteProductoRepository.save(variantesAActualizar);
        }

        // 4️⃣ Agregar nuevas variantes (solo las que no tienen ID)
        for (const nuevaVariante of variantes) {
          const existeEnBD = variantesActuales.some((v) => v.nombre === nuevaVariante.nombre);
          if (!existeEnBD) {
            console.log('A crear:', nuevaVariante);
            const varianteCreada = this.varianteProductoRepository.create({
              ...nuevaVariante,
              producto: { id: productoG.id }
            });
            await this.varianteProductoRepository.save(varianteCreada);
          }
        }
      }
      return productoG;
    } catch (error) {
      throw new Error(`Error al actualizar el producto: ${error.message}`);
    }
  }
  // Traer un producto por su ID
  async findOneProducto(id: string): Promise<Producto> {
    const producto = await this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .leftJoinAndSelect('producto.variantes', 'variantes')
      .select([
        'producto.id',
        'producto.codigo',
        'producto.alias',
        'producto.sku',
        'producto.descripcion',
        'producto.imagen',
        'producto.unidad_medida',
        'categoria',
        'variantes'
      ])
      .where('producto.id = :id', { id })
      .getOne();

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return producto;
  }



  // Eliminar un producto
  async deleteProducto(id: string): Promise<Object> {
    try {

      // Busca el producto por ID
      const producto = await this.productoRepository.findOne({ where: { id: id } });

      // Si no se encuentra el producto, lanza un error
      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      // Eliminar imagen relacionada si no es la imagen predeterminada
      if (producto.imagen !== 'https://res.cloudinary.com/dsuvpnp9u/image/upload/v1736440720/tli4lpfen5fucruno3l2.jpg') {
        const publicId = this.extractPublicId(producto.imagen);
        await this.cloudinaryService.deleteFile(publicId); // Eliminar de Cloudinary
      }

      // Elimina el producto de la base de datos
      await this.productoRepository.remove(producto);

      // Devuelve un mensaje de éxito
      return {
        message: "Producto eliminado con éxito.",
      };
    } catch (error) {
      console.log(error);

      throw new InternalServerErrorException(error);
    }
  }

  // Desactivar o activar producto
  async estadoProducto(id: string) {
    // Busca el producto por ID
    const producto = await this.productoRepository.findOne({ where: { id: id } });

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
    await this.productoRepository.save(producto);

    // Devuelve un mensaje de éxito
    return {
      message: 'Producto desactivado con éxito.',
    };
  }

  // Traer todos los productos
  async findAllProductos(): Promise<any[]> {
    const productos = await this.productoRepository.find({ relations: ['categoria'] });

    return productos;
  }
  // Traer todos los productos
  async findAllProductosCategoria(id_categoria: string): Promise<any[]> {
    const productos = await this.productoRepository.find({
      where: { categoria: { id: id_categoria } },
      relations: ['categoria']
    });

    return productos;
  }
  async getProductosCount(): Promise<number> {
    return this.productoRepository.count();
  }
  private extractPublicId(url: string): string {
    const parts = url.split('/');
    const fileWithExtension = parts[parts.length - 1];
    return fileWithExtension.split('.')[0]; // Elimina la extensión para obtener el public_id
  }
}
