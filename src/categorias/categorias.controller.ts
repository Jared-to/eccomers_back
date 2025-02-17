import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interface/valid-roles';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) { }

  @Post()
  @Auth(ValidRoles.admin, ValidRoles.user)
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createCategoriaDto: CreateCategoriaDto,
    @UploadedFile() file?: Express.Multer.File,) {

    return this.categoriasService.createCategoria(createCategoriaDto, file);
  }

  @Get()
  @Auth(ValidRoles.admin, ValidRoles.user)
  findAll() {
    return this.categoriasService.findAllCategorias();
  }

  @Get(':id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  findOne(@Param('id') id: string) {
    return this.categoriasService.findOneCategoria(id);
  }
  @Patch('estado/:id')
  isStatus(@Param('id') id: string) {
    return this.categoriasService.isStatusCategoria(id);
  }


  @Patch(':id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  @UseInterceptors(FileInterceptor('file'))
  update(@Param('id') id: string, @Body() updateCategoriaDto: UpdateCategoriaDto, @UploadedFile() file?: Express.Multer.File,) {
    return this.categoriasService.updateCategoria(id, updateCategoriaDto, file || null);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin, ValidRoles.user)
  remove(@Param('id') id: string) {
    return this.categoriasService.remove(id);
  }
}
