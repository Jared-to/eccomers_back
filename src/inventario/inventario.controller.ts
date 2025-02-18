import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { InventarioInicialDto } from './dto/inventario-inicial.dto';
import { AjustesInventario } from './service/ajustes-inventario.service';
import { CreateAjusteInventarioDto } from './dto/ajuste-inventario.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interface/valid-roles';
import { MovimientosAlmacenService } from './service/movimientos-almacen.service';
import { MovimientoInventario } from './entities/movimiento-inv';

@Controller('inventario')
export class InventarioController {
  constructor(
    private readonly inventarioService: InventarioService,
    private readonly ajustesService: AjustesInventario,
    private readonly movimientoInventarioService: MovimientosAlmacenService,

  ) { }

  @Post('inicial')
  createInvInicial(@Body() inventarioInicial: InventarioInicialDto) {
    return this.inventarioService.inventarioInicial(inventarioInicial);
  }


  @Post('ajuste')
  @Auth(ValidRoles.admin, ValidRoles.user)
  ajusteInventario(@Body() createAjuste: CreateAjusteInventarioDto) {
    return this.ajustesService.create(createAjuste);
  }

  @Patch('ajuste/:id')
  updateInventario(
    @Param('id') id: string,
    @Body() createAjuste: CreateAjusteInventarioDto
  ) {
    return this.ajustesService.updateAjuste(id, createAjuste);
  }
  @Get('publicas/:almacen/:categoria')
  traerProductosPublicos(@Param('almacen') almacen: string, @Param('categoria') categoria: string) {
    return this.inventarioService.obtenerProductosPorCategoriaYAlmacen(almacen, categoria)
  }
  
  @Get('ajuste')
  @Auth(ValidRoles.admin, ValidRoles.user)
  traerAjustes() {
    return this.ajustesService.obtenerAjustes()
  }

  @Get('ajuste/:id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  traerAjuste(@Param('id') id: string) {
    return this.ajustesService.obtenerAjuste(id);
  }

  @Get()
  @Auth(ValidRoles.admin, ValidRoles.user)
  obtenerInventario() {
    return this.inventarioService.obtenerInventarioCompleto();
  }

  @Get('almacen/:id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  obtenerInvAlmacen(@Param('id') id: string) {
    return this.inventarioService.obtenerProductosPorAlmacen(id);
  }

  @Get('almacenes/producto/:id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  obtenerStockAlmacen(@Param('id') id: string) {
    return this.inventarioService.obtenerAlmacenesPorProducto(id);
  }

  @Get('almacen/:almacenId/producto/:productoId')
  @Auth(ValidRoles.admin, ValidRoles.user)
  async obtenerInfoProductoAlmacen(
    @Param('almacenId') almacenId: string,
    @Param('productoId') productoId: string,
  ) {
    return await this.inventarioService.obtenerProductoPorAlmacenYProducto(almacenId, productoId);
  }

  @Get(':id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  obtenerInfoProductoInv(@Param('id') id: string) {
    return this.inventarioService.obtenerInfoProducto(id);
  }

  @Get('producto-codigo')
  @Auth(ValidRoles.admin, ValidRoles.user)
  async obtenerProductoPorCodigo(
    @Query('codigoBarras') codigoBarras: string,
    @Query('almacenId') almacenId: string,
  ) {
    return this.inventarioService.obtenerProductoPorCodigoBarras(codigoBarras, almacenId);
  }

  @Delete('ajuste/:id')
  async eliminarAjuste(
    @Param('id') id: string
  ) {
    return this.ajustesService.deleteAjuste(id);
  }


  //------------Movimientos----------------------
  @Get('movimientos/producto')
  @Auth(ValidRoles.admin, ValidRoles.user)
  async obtenerMovimientosPorProducto(
    @Query('productoId') productoId: string,
    @Query('codigo_barras') codigo_barras?: string,
    @Query('fechaIn') fechaIn?: string,
    @Query('fechaFn') fechaFn?: string,
  ): Promise<MovimientoInventario[]> {
    // Llamar al servicio para obtener los movimientos del producto
    return this.movimientoInventarioService.obtenerMovimientosPorProducto(
      productoId,
      fechaIn,
      fechaFn,
    );
  }
}
