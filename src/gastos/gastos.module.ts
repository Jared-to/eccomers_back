import { forwardRef, Module } from '@nestjs/common';
import { GastosService } from './gastos.service';
import { GastosController } from './gastos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gasto } from './entities/gasto.entity';
import { AuthModule } from 'src/auth/auth.module';
import { CategoriaGastosModule } from 'src/categoria-gastos/categoria-gastos.module';
import { CajasModule } from 'src/cajas/cajas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gasto]),
    AuthModule,
    CategoriaGastosModule,
    forwardRef(() => CajasModule)
  ],
  controllers: [GastosController],
  providers: [GastosService],
  exports:[TypeOrmModule,GastosService]
})
export class GastosModule { }
