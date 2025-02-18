import { Injectable } from '@nestjs/common';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { Repository } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { User } from 'src/auth/entities/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { DetallePedido } from './entities/productosPedido.entity';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(DetallePedido)
    private readonly detallePedidoRepository: Repository<DetallePedido>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly authService: AuthService,

  ) { }
  async solicitudPedido(createPedidoDto: CreatePedidoDto, file?: Express.Multer.File) {
    const direccionGps = createPedidoDto.dir_gps ? JSON.parse(createPedidoDto.dir_gps) : null;
    const detalles = JSON.parse(createPedidoDto.detalles);

    const pedido = await this.pedidoRepository.create({
      ...createPedidoDto,
      dir_gps: direccionGps,
      fechaPedido: new Date(),
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


  }
  async aceptarPedido(id: string, user: User) {

    const pedido = await this.pedidoRepository.findOne({
      where: { id, estado: 'Solicitado' }
    });
    const userD = await this.authService.getUserById(user.id);

    pedido.estado = 'Aceptado';
    pedido.usuario = userD;

    return await this.pedidoRepository.save(pedido);
  }
  async rechazarPedido(id: string, user: User) {

    const pedido = await this.pedidoRepository.findOne({
      where: { id, estado: 'Solicitado' }
    });
    const userD = await this.authService.getUserById(user.id);

    pedido.estado = 'Rechazado';
    pedido.usuario = userD;

    return await this.pedidoRepository.save(pedido);
  }

  async pedidosPendientes() {
    return this.pedidoRepository.find({ where: { estado: 'Solicitado' } })
  }
}
