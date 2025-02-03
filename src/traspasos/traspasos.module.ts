import { Module } from '@nestjs/common';
import { TraspasosService } from './traspasos.service';
import { TraspasosController } from './traspasos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetalleTraspaso } from './entities/detalleTraspaso.entity';
import { Traspaso } from './entities/traspaso.entity';
import { InventarioModule } from 'src/inventario/inventario.module';

@Module({
  controllers: [TraspasosController],
  providers: [TraspasosService],
  imports: [
    TypeOrmModule.forFeature([
      Traspaso,DetalleTraspaso
    ]),
    InventarioModule,
  ]
})
export class TraspasosModule { }
