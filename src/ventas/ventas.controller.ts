import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Venta } from './entities/venta.entity';
import { ValidRoles } from 'src/auth/interface/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/auth/entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { BasicAuthGuard } from './guards/basic-auth.guard';
import { ConfirmarPagoDto } from './dto/confirmar-pago.dto';
import { CreateQRDto } from './dto/create-qr.dto';
import { AuthService } from 'src/auth/auth.service';

@Controller('ventas')
export class VentasController {
  constructor(
    private readonly ventasService: VentasService,
    private readonly authService: AuthService,

  ) { }

  @Post()
  @Auth(ValidRoles.admin, ValidRoles.user)
  create(@Body() createVentaDto: CreateVentaDto) {

    return this.ventasService.create(createVentaDto);
  }


  @Get()
  @Auth(ValidRoles.admin, ValidRoles.user)
  @Auth()
  async findAllDates(
    @Query('fechaInicio') fechaInicio: string | 'xx',
    @Query('fechaFin') fechaFin: string | 'xx',
    @GetUser() user: User
  ): Promise<Venta[]> {

    return this.ventasService.findAllDates(fechaInicio, fechaFin, user);
  }

  @Get('chart')
  async getDatosChart(@Query('tipo') tipo: 'semana' | 'mes' | 'todo') {
    return this.ventasService.obtenerDatosVentas(tipo || 'semana');
  }

  @Get(':id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  findOne(@Param('id') id: string) {
    return this.ventasService.findOne(id);
  }

  @Get('edit/:id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  findOneEdit(@Param('id') id: string) {
    return this.ventasService.findOneEdit(id);
  }
  @Patch(':id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  update(@Param('id') id: string, @Body() updateVentaDto: UpdateVentaDto) {

    return this.ventasService.update(id, updateVentaDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  remove(@Param('id') id: string) {
    return this.ventasService.remove(id);
  }

  @Post('generar-QR')
  @UseGuards(BasicAuthGuard)
  async generarQR(@Body() dto: CreateQRDto) {

    const token = await this.authService.getUserTokenQR();


    const qr = await this.ventasService.generarQRPublic(dto, token);
    return qr;
  }

  //Controlador para la verificacion de estado
  @Get('qr-status/:alias')
  @Auth(ValidRoles.admin, ValidRoles.user)
  async getQRStatus(
    @Param('alias') alias: string,
    @GetUser() user: User
  ): Promise<{ estado: string }> {
    const estado = await this.ventasService.verificarEstadoQR(alias, user.tokenQR);
    return { estado };
  }

  //Controlador para la verificacion de estado
  @Get('publico/qr-status/:alias')
  @UseGuards(BasicAuthGuard)
  async getQRStatusPublic(@Param('alias') alias: string,): Promise<{ estado: string }> {

    const token = await this.authService.getUserTokenQR();

    const estado = await this.ventasService.verificarEstadoQR(alias, token);
    return { estado };
  }

  //Controlador para comprobar mediante una consulta POST en postman
  @Post('confirmarPago')
  @UseGuards(BasicAuthGuard)
  async confirmarPago(@Body() data: ConfirmarPagoDto) {
    return this.ventasService.confirmarPagoQR(data);
  }

}
