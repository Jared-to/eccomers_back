import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CategoriaActivoService } from '../service/categoriaActivo.service';
import { CreateCategoriaActivoDto } from '../dto/createCategoria.dto';

@Controller('categoria/activos')
export class CategoriasActivosController {
  constructor(
    private readonly categoriaService: CategoriaActivoService,

  ) { }

  @Post()
  createCategoria(@Body() createCategoriaActivoDto: CreateCategoriaActivoDto) {
    return this.categoriaService.create(createCategoriaActivoDto);
  }

  @Get()
  findAllCategoria() {
    return this.categoriaService.findAll();
  }

  @Get('/:id')
  findOneCategoria(@Param('id') id: string) {
    return this.categoriaService.findOne(id);
  }

  @Patch('/:id')
  updateCategoria(@Param('id') id: string, @Body() updateCategoriaActivo: CreateCategoriaActivoDto) {
    return this.categoriaService.update(id, updateCategoriaActivo);
  }

  @Delete('/:id')
  removeCategoria(@Param('id') id: string) {
    return this.categoriaService.remove(id);
  }
}
