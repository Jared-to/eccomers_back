import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PedidosService } from '../pedidos.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@WebSocketGateway({ cors: true })
export class PedidoGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly pedidoService: PedidosService,
    private readonly eventEmitter: EventEmitter2,  // Inyectar EventEmitter2
  ) { }

  afterInit(server: Server) {
    console.log('Socket.IO inicializado');
    this.listenToPedidoCreado();  // Hacer que el gateway escuche los eventos
    this.pedidosAceptado()
    this.pedidosRechazaos()
  }


  handleConnection(client: any) {
    console.log(`Cliente conectado: ${client.id}`);
    this.emitirPedidosPendientes();
  }

  handleDisconnect(client: any) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  // Escuchar el evento 'pedido.creado' emitido por PedidosService
  listenToPedidoCreado() {
    this.eventEmitter.on('pedido.creado', () => this.emitirPedidosPendientes());
  }

  // Escuchar el evento 'pedido.aceptado' emitido por PedidosService
  pedidosAceptado() {
    this.eventEmitter.on('pedido.aceptado', () => this.emitirPedidosPendientes());
  }
  // Escuchar el evento 'pedido.rechazados' emitido por PedidosService
  pedidosRechazaos() {
    this.eventEmitter.on('pedido.rechazado', () => {
      this.emitirPedidosPendientes();
    });
  }

  async emitirPedidosPendientes() {
    const pedidos = await this.pedidoService.pedidosPendientes();
    this.server.emit('pedidosPendientes', pedidos);
  }

}
