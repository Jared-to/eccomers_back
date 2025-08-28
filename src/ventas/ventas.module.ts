import { forwardRef, Module } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';
import { InventarioModule } from 'src/inventario/inventario.module';
import { ProductosModule } from 'src/productos/productos.module';
import { AlmacenesModule } from 'src/almacenes/almacenes.module';
import { Producto } from 'src/productos/entities/producto.entity';
import { Almacen } from 'src/almacenes/entities/almacen.entity';
import { CajasModule } from 'src/cajas/cajas.module';
import { DescuentosModule } from 'src/descuentos/descuentos.module';
import { ClientesModule } from 'src/clientes/clientes.module';
import { PedidosModule } from 'src/pedidos/pedidos.module';
import { ConfirmacionPagoQR } from './entities/confirmaciones-pago-qr.entity';
import { QrGenerados } from './entities/qr-generados.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, DetalleVenta, Producto, Almacen, ConfirmacionPagoQR, QrGenerados]),
    AuthModule,
    InventarioModule,
    ProductosModule,
    AlmacenesModule,
    CajasModule,
    DescuentosModule,
    forwardRef(() => ClientesModule),
    forwardRef(() => PedidosModule),

  ],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [TypeOrmModule, VentasService]
})
export class VentasModule { }
