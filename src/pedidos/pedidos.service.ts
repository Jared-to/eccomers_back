import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { In, Repository } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { User } from 'src/auth/entities/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { DetallePedido } from './entities/productosPedido.entity';
import { CreateVentaDto } from 'src/ventas/dto/create-venta.dto';
import { ClientesService } from 'src/clientes/clientes.service';
import { VentasService } from 'src/ventas/ventas.service';
import * as moment from 'moment-timezone';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(DetallePedido)
    private readonly detallePedidoRepository: Repository<DetallePedido>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly authService: AuthService,
    private readonly clientesService: ClientesService,
    private readonly ventasService: VentasService,

  ) { }
  async solicitudPedido(createPedidoDto: CreatePedidoDto, file?: Express.Multer.File) {
    const direccionGps = createPedidoDto.dir_gps ? JSON.parse(createPedidoDto.dir_gps) : null;
    const detalles = JSON.parse(createPedidoDto.detalles);

    const pedido = await this.pedidoRepository.create({
      ...createPedidoDto,
      dir_gps: direccionGps,
      fechaPedido: moment().tz("America/La_Paz").format("YYYY-MM-DD HH:mm:ss"),
      almacen: { id: createPedidoDto.sucursal }
    })
    if (file) {
      // Subir imágenes a Cloudinary
      const uploadPromises = await this.cloudinaryService.uploadFile(file);
      pedido.fotoRecibo = uploadPromises.secure_url;
    }
    const pedidoG = await this.pedidoRepository.save(pedido);
    //detalles del pedido
    for (const element of detalles) {
      const detalle = await this.detallePedidoRepository.create({
        ...element,
        producto: { id: element.productoId },
        pedido: { id: pedidoG.id },
      })
      await this.detallePedidoRepository.save(detalle)
    }
    // Generar el nuevo código único
    const nuevoCodigo = pedidoG
      ? `PD${String(pedidoG.increment).padStart(5, '0')}`
      : 'PD00001';

    pedidoG.codigo = nuevoCodigo;
    return await this.pedidoRepository.save(pedidoG)

  }
  async aceptarPedido(id: string, user: string) {

    const pedido = await this.pedidoRepository.findOne({
      where: { id, estado: 'Solicitado' }
    });
    const userD = await this.authService.getUserById(user);

    pedido.estado = 'Aceptado';
    pedido.usuario = userD;

    return await this.pedidoRepository.save(pedido);
  }
  async rechazarPedido(id: string,) {
    const pedido = await this.pedidoRepository.findOne({
      where: { id }
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido con id ${id} no encontrado`)
    }
    //eliminar foto si esque lo tiene
    if (pedido.fotoRecibo) {
      const publicId = this.extractPublicId(pedido.fotoRecibo);
      await this.cloudinaryService.deleteFile(publicId);
    }

    await this.pedidoRepository.remove(pedido);
    return "Pedido eliminado con exito"
  }
  async cancelarPedido(id: string, user: string) {
    const pedido = await this.pedidoRepository.findOne({
      where: { id, estado: 'Aceptado' }
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido con id ${id} no encontrado`)
    }
    const userD = await this.authService.getUserById(user);

    pedido.estado = 'Cancelado';
    pedido.usuario = userD;

    return this.pedidoRepository.save(pedido);

  }
  async reanudarPedido(id: string, user: string) {
    const pedido = await this.pedidoRepository.findOne({
      where: { id, estado: 'Cancelado' }
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido con id ${id} no encontrado`)
    }
    const userD = await this.authService.getUserById(user);

    pedido.estado = 'Aceptado';
    pedido.usuario = userD;

    return this.pedidoRepository.save(pedido);

  }
  async pedidosPendientes() {
    return this.pedidoRepository.find({
      where: { estado: 'Solicitado' },
      relations: ['almacen']
    })
  }
  async pedidosAceptados() {
    return this.pedidoRepository.find({
      where: { estado: 'Aceptado' },
      relations: ['almacen']
    })
  }
  async pedidosEntregados() {
    return this.pedidoRepository.find({
      where: { estado: 'Vendido' },
      relations: ['almacen']
    })
  }
  async pedidosCancelados() {
    return this.pedidoRepository.find({
      where: { estado: 'Cancelado' },
      relations: ['almacen']
    })
  }
  async informacionPedido(id: string) {
    return this.pedidoRepository.findOne({
      where: { id: id },
      relations: ['almacen', 'detalles', 'detalles.producto', 'usuario', 'venta']
    })
  }
  async pedidoVenta(id: string, cajaId: string, user: string) {
    const pedido = await this.pedidoRepository.findOne(
      {
        where: { id },
        relations: ['almacen', 'detalles', 'detalles.producto']
      }
    )
    //1er buscar cliente por el nombre y apellido si no se encuentra se crea uno nuevo 
    let cliente = await this.clientesService.findOneParams(pedido.nombreSolicitante, pedido.apellidoSolicitante);

    if (!cliente) {
      cliente = await this.clientesService.create({
        nombre: pedido.nombreSolicitante,
        apellido: pedido.apellidoSolicitante,
        telefono: pedido.numeroSolicitante
      })
    }
    const detalles = pedido.detalles.map(pedido => ({
      id_producto: pedido.producto.id,
      precio: pedido.precio,
      cantidad: pedido.cantidad,
      unidad_medida: pedido.unidad_medida,
      nombreVariante: pedido.variante,
      descuento: 0,
      subtotal: pedido.subtotal
    }))
    //2: Asignar valores a la venta segun el pedido
    const venta: CreateVentaDto = {
      almacen: pedido.almacen.id,
      cajaId,
      cliente: cliente.id,
      descuento: 0,
      subtotal: pedido.total,
      tipo_pago: pedido.metodoPago,
      total: pedido.total,
      ventaAlContado: true,
      fecha: new Date(),
      vendedor: user,
      detalles
    }

    //3: Crear la venta
    const ventaG = await this.ventasService.create(venta);

    //4 asignar venta al pedido
    pedido.venta = ventaG;
    pedido.vendido = true;
    pedido.estado = 'Vendido';
    //5 Guardar Pedido
    return this.pedidoRepository.save(pedido);
  }

  private extractPublicId(url: string): string {
    const parts = url.split('/');
    const fileWithExtension = parts[parts.length - 1];
    return fileWithExtension.split('.')[0]; // Elimina la extensión para obtener el public_id
  }
}

