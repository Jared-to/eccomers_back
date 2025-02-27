import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';

import { CreateInventarioDto } from './dto/create-inventario.dto';
import { Inventario } from './entities/inventario.entity';
import { InventarioInicialDto } from './dto/inventario-inicial.dto';
import { inventarioInicial } from './entities/inventario-inicial.entity';
import { MovimientosAlmacenService } from './service/movimientos-almacen.service';
import { ProductosService } from 'src/productos/productos.service';
import { AlmacenesService } from 'src/almacenes/almacenes.service';
import { Producto } from 'src/productos/entities/producto.entity';
import { Almacen } from 'src/almacenes/entities/almacen.entity';
import { CategoriasService } from 'src/categorias/categorias.service';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(inventarioInicial)
    private readonly inventarioInicialRepository: Repository<inventarioInicial>,
    private readonly movimientosService: MovimientosAlmacenService,
    private readonly productosService: ProductosService,
    private readonly AlmacenService: AlmacenesService,
    private readonly CategoriaService: CategoriasService,
  ) { }

  //agregar inventario inicial
  async inventarioInicial(inventarioInicialDto: InventarioInicialDto): Promise<Inventario[]> {
    const { almacen_id, productos } = inventarioInicialDto;
    try {

      // Crear una lista para almacenar los inventarios creados o actualizados
      const inventarios = [];

      for (const producto of productos) {
        const { producto_id, cantidad, precio_compra } = producto;

        //  Registrar en la tabla `inventarioInicial`
        const registroInicial = this.inventarioInicialRepository.create({
          almacen_id,
          cantidad,
          fecha: new Date().toISOString(),
          precio_compra,
          producto_id,
        });

        await this.inventarioInicialRepository.save(registroInicial);

        //  Actualizar o crear en la tabla `inventario`
        let inventario = await this.inventarioRepository.findOne({
          where: { almacen: { id: almacen_id }, product: { id: producto_id } },
        });

        let product = await this.productosService.findOneProducto(producto_id);
        let almacen = await this.AlmacenService.findOne(almacen_id);
        if (!inventario) {
          // Crear nuevo registro en inventario general 
          inventario = this.inventarioRepository.create({
            almacen: almacen,
            product: product,
            stock: cantidad,
            precio_compra
          });
        } else {
          // Incrementar stock si ya existe
          inventario.stock += cantidad;
        }

        const inventarioGuardado = await this.inventarioRepository.save(inventario);

        // Agregar a la lista de inventarios procesados
        inventarios.push(inventarioGuardado);

        //  Registrar movimiento de ingreso
        await this.movimientosService.registrarIngreso({
          almacenId: almacen_id,
          productoId: producto_id,
          cantidad,
          descripcion: 'INVENTARIO INICIAL',
        });
      }

      return inventarios;
    } catch (error) {
      console.log(error);

      throw new InternalServerErrorException('Código de barras duplicado.');
    }
  }

  async agregarStock(createInventarioDto: CreateInventarioDto): Promise<Inventario> {
    const { almacenId, cantidad, productoId } = createInventarioDto;

    let inventario = await this.inventarioRepository.findOne({
      where: { almacen: { id: almacenId }, product: { id: productoId } },
    });

    if (!inventario) {
      let product = await this.productosService.findOneProducto(productoId);
      let almacen = await this.AlmacenService.findOne(almacenId);
      inventario = this.inventarioRepository.create({
        almacen: almacen,
        product: product,
        stock: cantidad,
      });
    } else {
      inventario.stock += cantidad;
    }

    // Guardar en la base de datos
    await this.inventarioRepository.save(inventario);

    return inventario; // Retornar el inventario actualizado
  }

  // Descontar stock de un producto en un almacén
  async descontarStock(createInventarioDto: CreateInventarioDto): Promise<Inventario> {
    const { almacenId, cantidad, productoId } = createInventarioDto;

    const inventario = await this.inventarioRepository.findOne({
      where: { almacen: { id: almacenId }, product: { id: productoId } },
    });

    if (!inventario) {
      throw new NotFoundException(`El producto no está registrado en el inventario para este almacén.`);
    }

    if (inventario.stock < cantidad) {
      throw new Error('No hay suficiente stock disponible para descontar esta cantidad.');
    }

    inventario.stock -= cantidad;

    // Guardar en la base de datos
    await this.inventarioRepository.save(inventario);

    return inventario; // Retornar el inventario actualizado
  }
  async agregarStockTransactional(
    createInventarioDto: CreateInventarioDto,
    queryRunner: QueryRunner,
  ): Promise<Inventario> {
    const { almacenId, cantidad, productoId } = createInventarioDto;

    // Buscar el inventario existente dentro de la transacción
    let inventario = await queryRunner.manager.findOne(Inventario, {
      where: { almacen: { id: almacenId }, product: { id: productoId } },
      relations: ['almacen', 'product'],
    });

    if (!inventario) {
      const product = await queryRunner.manager.findOne(Producto, { where: { id: productoId } });
      const almacen = await queryRunner.manager.findOne(Almacen, { where: { id: almacenId } });

      if (!product || !almacen) {
        throw new NotFoundException(`El producto o almacén especificado no existe.`);
      }

      inventario = queryRunner.manager.create(Inventario, {
        almacen,
        product,
        stock: cantidad,
      });
    } else {
      inventario.stock += cantidad;
    }

    // Guardar en la base de datos dentro de la transacción
    await queryRunner.manager.save(inventario);

    return inventario; // Retornar el inventario actualizado
  }

  async descontarStockTransactional(
    createInventarioDto: CreateInventarioDto,
    queryRunner: QueryRunner,
  ): Promise<Inventario> {
    const { almacenId, cantidad, productoId } = createInventarioDto;

    // Buscar el inventario existente dentro de la transacción
    const inventario = await queryRunner.manager.findOne(Inventario, {
      where: { almacen: { id: almacenId }, product: { id: productoId } },
      relations: ['almacen', 'product'],
    });

    if (!inventario) {
      throw new NotFoundException(`El producto no está registrado en el inventario para este almacén.`);
    }

    if (inventario.stock < cantidad) {
      throw new Error('No hay suficiente stock disponible para descontar esta cantidad.');
    }

    inventario.stock -= cantidad;

    // Guardar en la base de datos dentro de la transacción
    await queryRunner.manager.save(inventario);

    return inventario; // Retornar el inventario actualizado
  }
  // Traer todo el inventario
  async obtenerInventarioCompleto(): Promise<any[]> {
    const inventario = await this.inventarioRepository
      .createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.product', 'producto')
      .select([
        'producto.id AS id_producto',
        'producto.alias AS alias',
        'producto.descripcion AS descripcion',
        'producto.unidad_medida AS unidad_medida',
        'producto.sku AS sku',
        'producto.imagen AS imagen',
        'producto.codigo AS codigo',
        'SUM(inventario.stock) AS stock', // Sumar el stock de todos los almacenes
      ])
      .groupBy('producto.id') // Agrupar solo por columnas del producto
      .addGroupBy('producto.alias')
      .addGroupBy('producto.descripcion')
      .addGroupBy('producto.unidad_medida')
      .addGroupBy('producto.sku')
      .addGroupBy('producto.imagen')
      .addGroupBy('producto.codigo')
      .getRawMany();

    // Mapeamos los resultados para garantizar que todos los campos sean devueltos correctamente
    return inventario.map((item) => ({
      id_producto: item.id_producto,
      alias: item.alias,
      descripcion: item.descripcion,
      unidad_medida: item.unidad_medida,
      sku: item.sku,
      imagen: item.imagen,
      codigo: item.codigo,
      stock: parseFloat(item.stock), // Asegúrate de devolver el stock como número
    }));
  }

  // Traer productos de un almacén específico con sus variantes
  async obtenerProductosPorAlmacen(almacenId: string): Promise<any> {
    // Validar si el almacén existe
    const almacen = await this.AlmacenService.findOne(almacenId);
    if (!almacen) {
      throw new NotFoundException(`Almacén con ID ${almacenId} no encontrado`);
    }

    // Obtener productos con variantes
    const inventario = await this.inventarioRepository
      .createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.product', 'producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .leftJoinAndSelect('inventario.almacen', 'almacen')
      .leftJoinAndSelect('producto.variantes', 'variantes') // Unir las variantes
      .select([
        'producto.id AS id_producto',
        'producto.codigo AS codigo',
        'producto.alias AS alias',
        'producto.descripcion AS descripcion',
        'producto.imagen AS imagen',
        'producto.sku AS sku',
        'producto.unidad_medida AS unidad_medida',
        'categoria.nombre AS categoria',
        'categoria.id AS id_categoria',
        'almacen.nombre AS almacen',
        'inventario.id AS id_inventario',
        'almacen.id AS almacen_id',
        'inventario.stock AS stock',
        'variantes.id AS variante_id',
        'variantes.nombre AS variante_nombre',
        'variantes.precio AS variante_precio',
      ])
      .where('producto.estado = true')
      .andWhere('almacen.id = :almacenId', { almacenId })
      .getRawMany();

    // Mapear productos con sus variantes en un formato estructurado
    const productosMap = new Map();

    inventario.forEach((item) => {
      const {
        id_producto,
        codigo,
        alias,
        descripcion,
        imagen,
        sku,
        unidad_medida,
        categoria,
        id_categoria,
        almacen,
        almacen_id,
        id_inventario,
        stock,
        variante_id,
        variante_nombre,
        variante_precio,
      } = item;

      if (!productosMap.has(id_producto)) {
        productosMap.set(id_producto, {
          id_producto,
          codigo,
          alias,
          descripcion,
          imagen,
          sku,
          unidad_medida,
          categoria: { id: id_categoria, nombre: categoria },
          almacen: { id: almacen_id, nombre: almacen },
          id_inventario,
          stock,
          variantes: [],
        });
      }

      // Agregar variantes al producto si existen
      if (variante_id) {
        productosMap.get(id_producto).variantes.push({
          id: variante_id,
          nombre: variante_nombre,
          precio: variante_precio,
        });
      }
    });

    // Devolver la respuesta con los productos agrupados
    return {
      nombre: almacen.nombre,
      ubicacion: almacen.ubicacion,
      inventario: Array.from(productosMap.values()), // Convertir Map a Array
    };
  }
  async obtenerAlmacenesPorProducto(productoId: string): Promise<any[]> {
    // Validar si el producto existe
    const producto = await this.productosService.findOneProducto(productoId);

    if (!producto) {
      throw new NotFoundException(`Producto con ID "${productoId}" no encontrado.`);
    }

    // Obtener almacenes relacionados al producto desde el inventario
    const inventario = await this.inventarioRepository
      .createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.product', 'producto')
      .leftJoinAndSelect('inventario.almacen', 'almacen')
      .where('inventario.product = :productoId', { productoId })
      .select([
        'inventario.almacen AS almacen_nombre',
        'almacen.nombre AS almacen_nombre',
        'inventario.stock AS stock',
        'inventario.precio_compra AS precio_compra',
        'producto.alias AS producto_nombre',
        'producto.descripcion AS producto_descripcion',
        'producto.unidad_medida AS unidad_medida',
        'producto.sku AS sku',
        'producto.imagen AS imagen',
        'producto.codigo AS codigo',
      ])
      .orderBy('inventario.almacen', 'ASC')
      .getRawMany();

    if (!inventario || inventario.length === 0) {
      throw new NotFoundException(`No se encontraron registros del producto con ID "${productoId}" en ningún almacén.`);
    }

    // Formatear la respuesta
    return inventario
  }
  async obtenerProductosPorCategoriaYAlmacen(
    almacenId: string,
    categoriaId: string
  ): Promise<any> {
    // Validar si el almacén existe
    const almacen = await this.AlmacenService.findOne(almacenId);
    if (!almacen) {
      throw new NotFoundException(`Almacén con ID ${almacenId} no encontrado`);
    }

    // Validar si la categoría existe
    const categoria = await this.CategoriaService.findOneCategoria(categoriaId);
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${categoriaId} no encontrada`);
    }

    // Obtener productos con sus variantes filtrados por almacén y categoría
    const inventario = await this.inventarioRepository
      .createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.product', 'producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .leftJoinAndSelect('inventario.almacen', 'almacen')
      .leftJoinAndSelect('producto.variantes', 'variante') // <-- Se unen las variantes
      .select([
        'producto.id AS id_producto',
        'producto.codigo AS codigo',
        'producto.alias AS alias',
        'producto.descripcion AS descripcion',
        'producto.imagen AS imagen',
        'producto.sku AS sku',
        'producto.unidad_medida AS unidad_medida',
        'categoria.nombre AS categoria',
        'categoria.id AS id_categoria',
        'almacen.nombre AS almacen',
        'inventario.id AS id_inventario',
        'almacen.id AS almacen_id',
        'inventario.stock AS stock',
        'variante.id AS id_variante', // ID de la variante
        'variante.nombre AS nombre_variante', // Nombre de la variante
        'variante.precio AS precio_variante', // Precio de la variante
      ])
      .where('producto.estado = true')
      .andWhere('almacen.id = :almacenId', { almacenId })
      .andWhere('categoria.id = :categoriaId', { categoriaId }) // Filtrar por categoría
      .getRawMany();

    // Agrupar productos y sus variantes
    const productosMap = new Map();

    inventario.forEach(item => {
      const {
        id_producto,
        codigo,
        alias,
        descripcion,
        imagen,
        sku,
        unidad_medida,
        id_categoria,
        categoria,
        almacen,
        almacen_id,
        id_inventario,
        stock,
        id_variante,
        nombre_variante,
        precio_variante,
      } = item;

      if (!productosMap.has(id_producto)) {
        productosMap.set(id_producto, {
          id_producto,
          codigo,
          alias,
          descripcion,
          imagen,
          sku,
          unidad_medida,
          id_categoria,
          categoria,
          almacen,
          almacen_id,
          id_inventario,
          stock,
          variantes: []
        });
      }

      if (id_variante) {
        productosMap.get(id_producto).variantes.push({
          id_variante,
          nombre_variante,
          precio_variante,
        });
      }
    });

    // Construir la respuesta
    return {
      nombre_almacen: almacen.nombre,
      ubicacion_almacen: almacen.ubicacion,
      nombre_categoria: categoria.nombre,
      inventario: Array.from(productosMap.values()), // Convertir el Map a Array
    };
  }


  async obtenerInfoProducto(id_inventario: string): Promise<any> {

    const productoInfo = await this.inventarioRepository.findOne({ where: { id: id_inventario }, relations: ['product'] })

    if (!productoInfo) {
      throw new NotFoundException(`No se encontró información para el producto con ID "${id_inventario}".`);
    }

    return productoInfo
  }

  async obtenerProductoPorAlmacenYProducto(almacenId: string, productoId: string): Promise<any> {

    // Consulta para obtener información del producto específico en el almacén
    const resultado = await this.inventarioRepository.findOne({ where: { almacen: { id: almacenId }, product: { id: productoId } }, relations: ['product'] })

    const product = await this.productosService.findOneProducto(resultado.product.id);

    return {
      ...resultado,
      ...product,
      total_stock: resultado.stock
    }

  }


}
