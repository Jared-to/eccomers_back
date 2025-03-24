import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Venta } from './entities/venta.entity';
import { ValidRoles } from 'src/auth/interface/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/auth/entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('ventas')
export class VentasController {
  constructor(
    private readonly ventasService: VentasService,

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

}
