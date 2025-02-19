import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { createAlmacen, createUserSeed, createCliente, createCategoria } from './data/data'
import { AlmacenesService } from 'src/almacenes/almacenes.service';
import { ClientesService } from 'src/clientes/clientes.service';
import { CategoriasService } from 'src/categorias/categorias.service';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly authServie: AuthService,
    private readonly almacenServie: AlmacenesService,
    private readonly clientesService: ClientesService,
    private readonly categoriaService: CategoriasService,
    private readonly configService: ConfigService,

  ) { }
  async create(): Promise<object> {

    const almacen = await this.almacenServie.create(createAlmacen);

    createUserSeed.almacen = almacen.id;
    const cliente = await this.clientesService.create(createCliente);
    const seed = await this.authServie.create(createUserSeed)
    const categoria = await this.categoriaService.createCategoria(createCategoria);
    const config = await this.configService.configInicial()
    if (!seed || !almacen || !cliente || !categoria || !config) {
      throw new InternalServerErrorException('Error al hacer el seed.')
    }
    return {
      message: 'Seed Excute'
    }
  }

}
