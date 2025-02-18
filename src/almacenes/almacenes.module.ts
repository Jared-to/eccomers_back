import { Module } from '@nestjs/common';
import { AlmacenesService } from './almacenes.service';
import { AlmacenesController } from './almacenes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Almacen } from './entities/almacen.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [AlmacenesController],
  providers: [AlmacenesService],
  imports: [
    TypeOrmModule.forFeature([Almacen]),
    AuthModule
  ],
  exports:[AlmacenesService],
})
export class AlmacenesModule { }
