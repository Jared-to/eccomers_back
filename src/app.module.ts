import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesModule } from './clientes/clientes.module';
import { ProductosModule } from './productos/productos.module';
import { CategoriasModule } from './categorias/categorias.module';
import { AlmacenesModule } from './almacenes/almacenes.module';
import { InventarioModule } from './inventario/inventario.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { VentasModule } from './ventas/ventas.module';
import { GastosModule } from './gastos/gastos.module';
import { CajasModule } from './cajas/cajas.module';
import { CategoriaGastosModule } from './categoria-gastos/categoria-gastos.module';
import { SeedModule } from './seed/seed.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ReportesModule } from './reportes/reportes.module';
import { ExcelModule } from './excel/excel.module';
import { HomeModule } from './home/home.module';
import { ActivosModule } from './activos/activos.module';
import { TraspasosModule } from './traspasos/traspasos.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { ConfigModuleConfig } from './config/config.module';
import { DescuentosModule } from './descuentos/descuentos.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot(
      {
        isGlobal: true
      }
    ),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    ClientesModule,
    ProductosModule,
    CategoriasModule,
    AlmacenesModule,
    InventarioModule,
    ProveedoresModule,
    VentasModule,
    GastosModule,
    CajasModule,
    CategoriaGastosModule,
    SeedModule,
    CloudinaryModule,
    ReportesModule,
    ExcelModule,
    HomeModule,
    ActivosModule,
    TraspasosModule,
    PedidosModule,
    ConfigModuleConfig,
    DescuentosModule,
    NotificacionesModule,
    EventEmitterModule.forRoot(),
  ],
})
export class AppModule { }
