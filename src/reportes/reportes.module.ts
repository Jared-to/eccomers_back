import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { PrinterService } from './helpers/printer.helper';
import { VentasModule } from 'src/ventas/ventas.module';
import { ClientesModule } from 'src/clientes/clientes.module';
import { GastosModule } from 'src/gastos/gastos.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ReportesController],
  providers: [ReportesService,PrinterService],
  imports:[
    VentasModule,
    ClientesModule,
    GastosModule,
    AuthModule
  ]
})
export class ReportesModule {}
