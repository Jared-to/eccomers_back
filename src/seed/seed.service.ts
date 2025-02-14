import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { createAlmacen, createUserSeed, createCliente } from './data/data'
import { AlmacenesService } from 'src/almacenes/almacenes.service';
import { ClientesService } from 'src/clientes/clientes.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly authServie: AuthService,
    private readonly almacenServie: AlmacenesService,
    private readonly clientesService: ClientesService,


  ) { }
  async create(): Promise<object> {

    const seed = await this.authServie.create(createUserSeed)
    const almacen = await this.almacenServie.create(createAlmacen);
    const cliente = await this.clientesService.create(createCliente);
    if (!seed || !almacen || !cliente) {
      throw new InternalServerErrorException('Error al hacer el seed.')
    }
    return {
      message: 'Seed Excute'
    }
  }

}
