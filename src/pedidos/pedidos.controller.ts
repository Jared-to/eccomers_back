import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) { }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createPedidoDto: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {

    return this.pedidosService.solicitudPedido(createPedidoDto, file || null);
  }

  @Get()
  getPedidosPendientes() {
    return this.pedidosService.pedidosPendientes();
  }

}
