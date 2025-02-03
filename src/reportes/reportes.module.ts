import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { PrinterService } from './helpers/printer.helper';
import { VentasModule } from 'src/ventas/ventas.module';
import { ClientesModule } from 'src/clientes/clientes.module';

@Module({
  controllers: [ReportesController],
  providers: [ReportesService,PrinterService],
  imports:[
    VentasModule,
    ClientesModule
  ]
})
export class ReportesModule {}
