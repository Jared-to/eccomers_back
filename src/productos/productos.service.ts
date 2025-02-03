import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Categoria } from 'src/categorias/entities/categoria.entity';
import { QueryRunner, Repository } from 'typeorm';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,

    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,

    private readonly cloudinaryService: CloudinaryService,
  ) { }

  // Crear un producto
  async createProducto(createProductoDto: CreateProductoDto, file?: Express.Multer.File): Promise<Producto> {
    const { categoriaId, ...productoData } = createProductoDto;
    console.log(createProductoDto);

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
      console.log(imagesUrl);

      const producto = this.productoRepository.create({
        ...productoData,
        imagen: imagesUrl || null,
        categoria,
        precio_min_venta: parseFloat(productoData.precio_min_venta),
        precio_venta: parseFloat(productoData.precio_venta),
      });
      const productoGuardado = await this.productoRepository.save(producto);

      // Validar si 'increment' existe, aunque debería ser garantizado por la base de datos
      // if (!productoGuardado.increment) {
      //   productoGuardado.increment = 1; // En caso de que sea nulo por algún motivo
      // }

      // Generar el código basado en el increment
      productoGuardado.codigo = `P${productoGuardado.increment.toString().padStart(4, '0')}`;

      // Guardar nuevamente el producto con el código generado
      return this.productoRepository.save(productoGuardado);
    } catch (error) {
      throw new Error(`Error al guardar el producto: ${error.message}`);
    }
  }

  async createProductoExcel(createProductoDto: CreateProductoDto, queryRunner?: QueryRunner): Promise<Producto> {
    const { categoriaId, ...productoData } = createProductoDto;

    let imagesUrl;
    try {
      // Buscar la categoría usando el QueryRunner si está presente
      const categoria = queryRunner
        ? await queryRunner.manager.findOne(Categoria, { where: { id: categoriaId } })
        : await this.categoriaRepository.findOne({ where: { id: categoriaId } });

      if (!categoria) {
        throw new NotFoundException(`Categoría con ID ${categoriaId} no encontrada`);
      }

      // Asignar imagen predeterminada si no se proporciona una
      if (!productoData.imagen) {
        imagesUrl =
          'https://res.cloudinary.com/dsuvpnp9u/image/upload/v1736440720/tli4lpfen5fucruno3l2.jpg';
      }

      // Crear el producto usando el QueryRunner si está presente
      const producto = queryRunner
        ? queryRunner.manager.create(Producto, {
          ...productoData,
          imagen: imagesUrl || null,
          categoria,
          precio_min_venta: parseFloat(productoData.precio_min_venta),
          precio_venta: parseFloat(productoData.precio_venta),
        })
        : this.productoRepository.create({
          ...productoData,
          imagen: imagesUrl || null,
          categoria,
          precio_min_venta: parseFloat(productoData.precio_min_venta),
          precio_venta: parseFloat(productoData.precio_venta),
        });

      // Guardar el producto usando el QueryRunner si está presente
      const productoGuardado = queryRunner
        ? await queryRunner.manager.save(Producto, producto)
        : await this.productoRepository.save(producto);

      // Validar si 'increment' existe
      if (!productoGuardado.increment) {
        productoGuardado.increment = 1; // En caso de que sea nulo
      }

      // Generar el código basado en el increment
      productoGuardado.codigo = `P${productoGuardado.increment.toString().padStart(4, '0')}`;

      // Guardar nuevamente el producto con el código generado usando el QueryRunner si está presente
      return queryRunner
        ? await queryRunner.manager.save(Producto, productoGuardado)
        : await this.productoRepository.save(productoGuardado);
    } catch (error) {
      throw new Error(`Error al guardar el producto: ${error.message}`);
    }
  }


  // Traer un producto por su ID
  async findOneProducto(id: string): Promise<Producto> {
    const producto = await this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .select([
        'producto.id',
        'producto.codigo',
        'producto.alias',
        'producto.sku',
        'producto.descripcion',
        'producto.precio_venta',
        'producto.precio_min_venta',
        'producto.imagen',
        'producto.unidad_medida',
        'categoria',
      ])
      .where('producto.id = :id', { id })
      .getOne();

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return producto;
  }

  // Editar un producto
  async updateProducto(
    id: string,
    updateProductoDto: UpdateProductoDto,
    file?: Express.Multer.File
  ): Promise<Producto> {
    const { categoriaId, ...productoData } = updateProductoDto;

    // Verificar si el producto existe
    let producto = await this.productoRepository.findOne({ where: { id } });
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

    // Actualizar los datos del producto
    producto = {
      ...producto,
      ...productoData,
      imagen: finalImage || producto.imagen, // Mantener la imagen previa si no se envía una nueva
      categoria,
      precio_min_venta: parseFloat(productoData.precio_min_venta),
      precio_venta: parseFloat(productoData.precio_venta),
    };

    try {
      return await this.productoRepository.save(producto);
    } catch (error) {
      throw new Error(`Error al actualizar el producto: ${error.message}`);
    }
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
