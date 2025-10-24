import { forwardRef, Module } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { Pedido } from './entities/pedido.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AuthModule } from 'src/auth/auth.module';
import { DetallePedido } from './entities/productosPedido.entity';
import { VentasModule } from 'src/ventas/ventas.module';
import { ClientesModule } from 'src/clientes/clientes.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificacionesModule } from 'src/notificaciones/notificaciones.module';

@Module({
  controllers: [PedidosController],
  providers: [ PedidosService,],
  imports: [
    TypeOrmModule.forFeature([Pedido, DetallePedido]),
    CloudinaryModule,
    AuthModule,
    forwardRef(() => ClientesModule),
    forwardRef(() => VentasModule),
    NotificacionesModule,
    EventEmitterModule.forRoot(),
  ],
  exports: [PedidosService, TypeOrmModule]
})
export class PedidosModule { }
