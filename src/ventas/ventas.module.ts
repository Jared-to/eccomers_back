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

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, DetalleVenta, Producto, Almacen]),
    AuthModule,
    InventarioModule,
    ProductosModule,
    AlmacenesModule,
    CajasModule,
    DescuentosModule,
    forwardRef(() => ClientesModule),
  ],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [TypeOrmModule, VentasService]
})
export class VentasModule { }
