import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interface/valid-roles';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) { }

  @Post()
  @Auth(ValidRoles.admin, ValidRoles.user)
  create(@Body() createClienteDto: CreateClienteDto) {

    return this.clientesService.create(createClienteDto);
  }

  @Get()
  @Auth(ValidRoles.admin, ValidRoles.user)
  findAll() {
    return this.clientesService.findAll();
  }

  @Get(':id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  @Get('perfil/:id')
  @Auth(ValidRoles.admin, ValidRoles.user) // Verifica si el usuario tiene el rol adecuado
  async findOnePerfil(
    @Param('id') id: string, // Recibe el id del cliente
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    // Si las fechas no son proporcionadas, usar un rango de fechas por defecto (por ejemplo, todo el año actual)
    if (!fechaInicio) {
      fechaInicio = new Date(new Date().getFullYear(), 0, 1).toISOString(); // Fecha de inicio: 1 de enero del año actual
    }
    if (!fechaFin) {
      fechaFin = new Date().toISOString(); // Fecha de fin: fecha actual
    }
    return this.clientesService.infoCliente(id, fechaInicio, fechaFin);
  }


  @Patch(':id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  async update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    const cliente = await this.clientesService.update(id, updateClienteDto);
    return {
      message: 'Cliente actualizado con éxito',
      producto: cliente,
    }
  }

  @Delete(':id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  async remove(@Param('id') id: string) {
    await this.clientesService.remove(id);
    return {
      message: 'Cliente eliminado con éxito',
    };
  }
}
