import { Module } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { Pedido } from './entities/pedido.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AuthModule } from 'src/auth/auth.module';
import { DetallePedido } from './entities/productosPedido.entity';

@Module({
  controllers: [PedidosController],
  providers: [PedidosService],
  imports: [
    TypeOrmModule.forFeature([Pedido,DetallePedido]),
    CloudinaryModule,
    AuthModule
  ]
})
export class PedidosModule { }
