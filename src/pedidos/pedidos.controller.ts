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
  ) {

    return this.pedidosService.solicitudPedido(createPedidoDto,);
  }

  @Get()
  getPedidosPendientes() {
    return this.pedidosService.pedidosPendientes();
  }
  @Get('aceptados')
  getPedidosAceptados() {
    return this.pedidosService.pedidosAceptados();
  }
  @Get('entregados')
  getPedidosEntregados() {
    return this.pedidosService.pedidosEntregados();
  }
  @Get('cancelados')
  getPedidosCancelados() {
    return this.pedidosService.pedidosCancelados();
  }

  @Get('/:id')
  getInfoPedido(@Param('id') id: string) {
    return this.pedidosService.informacionPedido(id);
  }

  @Patch('aceptar/:id/:user')
  aceptarPedido(@Param('id') id: string, @Param('user') user: string,) {
    return this.pedidosService.aceptarPedido(id, user);
  }

  @Patch('cancelar/:id/:user')
  cancelarPedido(@Param('id') id: string, @Param('user') user: string,) {
    return this.pedidosService.cancelarPedido(id, user);
  }

  @Patch('restaurar/:id/:user')
  restaurarPedido(@Param('id') id: string, @Param('user') user: string,) {
    return this.pedidosService.reanudarPedido(id, user);
  }

  @Post('confirmar/:id/:id_caja/:user/:metodo_pago/:idQR')
  confirmarPedido(@Param('id') id: string, @Param('id_caja') caja: string, @Param('user') user: string, @Param('metodo_pago') metodoPago: string,@Param('idQR') idQR: string,) {
    return this.pedidosService.pedidoVenta(id, caja, user, metodoPago,idQR);
  }

  @Delete('/:id')
  rechazarPedido(@Param('id') id: string) {
    return this.pedidosService.rechazarPedido(id);
  }

}
