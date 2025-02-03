import { Module } from '@nestjs/common';
import { ActivosService } from './activos.service';
import { ActivosController } from './activos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activo } from './entities/activo.entity';
import { CategoriaActivo } from './entities/categoria.entity';
import { CategoriaActivoService } from './service/categoriaActivo.service';
import { CategoriasActivosController } from './controller/categoriasActivos.controller';
import { MovimientosActivos } from './entities/movimientos-activos.entity';
import { MovimientosActivosController } from './controller/movimientosActivos.controller';
import { MovimientosActivosService } from './service/movimientosActivos.service';

@Module({
  controllers: [ActivosController,CategoriasActivosController,MovimientosActivosController],
  imports:[
        TypeOrmModule.forFeature([Activo,CategoriaActivo,MovimientosActivos]),
  ],
  providers: [ActivosService,CategoriaActivoService,MovimientosActivosService],
})
export class ActivosModule {}
