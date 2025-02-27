import { Module } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { Producto } from './entities/producto.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CategoriasModule } from 'src/categorias/categorias.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { VarianteProducto } from './entities/varianteProducto.entity';

@Module({
  controllers: [ProductosController],
  providers: [ProductosService],
  imports: [
    TypeOrmModule.forFeature([Producto,VarianteProducto]),
    AuthModule,
    CategoriasModule,
    CloudinaryModule
  ],
  exports:[ProductosService,TypeOrmModule]
})
export class ProductosModule {}
