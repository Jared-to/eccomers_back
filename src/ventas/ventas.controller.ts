import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Venta } from './entities/venta.entity';
import { ValidRoles } from 'src/auth/interface/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CuotasService } from './service/cuotas.service';
import { CreateCobroDto } from './dto/create-cobro.dto';

@Controller('ventas')
export class VentasController {
  constructor(
    private readonly ventasService: VentasService,
    private readonly cuotasService: CuotasService,

  ) { }

  @Post()
  @Auth(ValidRoles.admin, ValidRoles.user)
  create(@Body() createVentaDto: CreateVentaDto) {

    return this.ventasService.create(createVentaDto);
  }


  @Get()
  @Auth(ValidRoles.admin, ValidRoles.user)
  async findAllDates(
    @Query('fechaInicio') fechaInicio: string | 'xx',
    @Query('fechaFin') fechaFin: string | 'xx',
  ): Promise<Venta[]> {

    return this.ventasService.findAllDates(fechaInicio, fechaFin);
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

  //cuotas
  @Get('cuotas/:id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  findCobros(@Param('id') id: string) {
    return this.cuotasService.getCobrosPorVenta(id);
  }
  @Post('cuotas')
  @Auth(ValidRoles.admin, ValidRoles.user)
  nuevaCuota(@Body() createCobroDto: CreateCobroDto) {
    return this.cuotasService.createCobro(createCobroDto);
  }
}
