import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { MovimientosActivosService } from "../service/movimientosActivos.service";
import { CreateRegistroDto } from "../dto/registrar-registro.dto";


@Controller('movimientos/activos')
export class MovimientosActivosController {
  constructor(
    private readonly movimientosService: MovimientosActivosService,
  ) { }

  @Post('/:id')
  async registrar(@Param('id') id: string, @Body() createRegistro: CreateRegistroDto) {
    return await this.movimientosService.registrar(id, createRegistro);
  }
  
  @Get('por-rango-fechas')
  async obtenerMovimientosPorRangoFechas(
    @Query('id_activo') id_activo: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string
  ) {
    try {
      const fechaInicioDate = new Date(fechaInicio);
      const fechaFinDate = new Date(fechaFin);

      if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
        throw new Error('Las fechas proporcionadas no son válidas');
      }

      const movimientos = await this.movimientosService.obtenerMovimientosPorRangoFechas(
        id_activo,
        fechaInicioDate,
        fechaFinDate
      );

      return movimientos;
    } catch (error) {
      console.log(error);
      throw new Error('Error inesperado.');

    }
  }
  
  @Get('/:id')
  async movimientosActivos(@Param('id') id: string) {
    return await this.movimientosService.obtenerMovimientos(id);
  }


}