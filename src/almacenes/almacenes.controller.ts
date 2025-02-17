import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AlmacenesService } from './almacenes.service';
import { CreateAlmacenDto } from './dto/create-almacen.dto';
import { UpdateAlmacenDto } from './dto/update-almacen.dto';

@Controller('almacenes')
export class AlmacenesController {
  constructor(private readonly almacenesService: AlmacenesService) { }

  @Post()
  create(@Body() createAlmaceneDto: CreateAlmacenDto) {
    return this.almacenesService.create(createAlmaceneDto);
  }

  @Get()
  findAll() {
    return this.almacenesService.findAll();
  }
  @Get('publicos')
  findAllPublics() {
    return this.almacenesService.findAllPublic();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.almacenesService.findOne(id);
  }


  @Patch('estado/:id')
  isStatus(@Param('id') id: string) {
    return this.almacenesService.isStatusAlmacen(id);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlmaceneDto: UpdateAlmacenDto) {
    return this.almacenesService.update(id, updateAlmaceneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.almacenesService.remove(id);
  }
}
