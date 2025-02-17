import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Gasto } from './entities/gasto.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { User } from 'src/auth/entities/user.entity';
import { CategoriaGasto } from 'src/categoria-gastos/entities/categoria-gasto.entity';
import { CajasService } from 'src/cajas/cajas.service';
import { AlmacenesService } from 'src/almacenes/almacenes.service';

@Injectable()
export class GastosService {
  constructor(
    @InjectRepository(Gasto)
    private readonly gastoRepository: Repository<Gasto>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CategoriaGasto)
    private readonly categoriaRepository: Repository<CategoriaGasto>,
    private readonly almacenService: AlmacenesService,
    private readonly cajasService: CajasService,
  ) { }

  async create(createGastoDto: CreateGastoDto): Promise<Gasto> {
    const { usuarioId, categoriaId, cajaId, almacen, ...rest } = createGastoDto;

    const usuario = await this.userRepository.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }

    const categoria = await this.categoriaRepository.findOne({ where: { id: categoriaId } });
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${categoriaId} no encontrada.`);
    }
    const almacenD = await this.almacenService.findOne(almacen);

    const caja = await this.cajasService.findOne(cajaId);

    if (!caja) {
      throw new Error(' Caja  no encontrados.');
    }

    const gasto = this.gastoRepository.create({
      ...rest,
      caja,
      usuario,
      categoria,
      almacen: { id: almacenD.id }
    });

    const gastoGuardado = await this.gastoRepository.save(gasto);

    // Validar si 'increment' existe, aunque debería ser garantizado por la base de datos
    if (!gastoGuardado.increment) {
      gastoGuardado.increment = 1; // En caso de que sea nulo por algún motivo
    }

    // Generar el código basado en el increment
    gastoGuardado.codigo = `G${gastoGuardado.increment.toString().padStart(4, '0')}`;

    // Guardar nuevamente el gasto con el código generado
    return this.gastoRepository.save(gastoGuardado);
  }

  async findAll(id_user: string): Promise<Gasto[]> {
    const user = await this.userRepository.findOne({ where: { id: id_user } });

    if (!user) {
      throw new NotFoundException(`El usuario no fue encontrado: ${id_user}`);
    }

    const isAdmin = user.roles.some(role => role === 'admin');

    return this.gastoRepository.find({
      where: isAdmin ? {} : { usuario: { id: user.id } },
      relations: ['usuario', 'categoria', 'caja'],
    });
  }


  async findAllDates(fechaInicio: string | 'xx', fechaFin: string | 'xx', user: User): Promise<Gasto[]> {

    // Si ambas fechas son 'xx', obtenemos todas las ventas
    if (fechaInicio === 'xx' && fechaFin === 'xx') {

      const isAdmin = user.roles.some(role => role === 'admin');

      return this.gastoRepository.find({
        where: isAdmin ? {} : { usuario: { id: user.id } },
        relations: ['usuario', 'categoria', 'caja'],
      });
    }

    // Normalizamos las fechas a medianoche para ignorar horas
    const normalizeDate = (date: string) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0); // Establecemos la hora a medianoche
      return d;
    };

    const fechaInicioNormalizada = normalizeDate(fechaInicio);
    const fechaFinNormalizada = normalizeDate(fechaFin);

    // Si la fecha final es hoy, ajustamos para obtener hasta el final del día (23:59:59)
    if (fechaFin === fechaInicio) {
      fechaFinNormalizada.setHours(23, 59, 59, 999); // Fin del día (23:59:59)
    }


    const whereConditions: any = {};

    // Filtrar por rango de fechas si ambas fechas son proporcionadas
    if (fechaInicio && fechaFin) {
      whereConditions.fecha = Between(fechaInicioNormalizada, fechaFinNormalizada);
    } else if (fechaInicio) {
      whereConditions.fecha = { $gte: fechaInicioNormalizada };
    } else if (fechaFin) {
      whereConditions.fecha = { $lte: fechaFinNormalizada };
    }

    const gastos = await this.gastoRepository.find({
      where: whereConditions,
      relations: ['usuario', 'categoria', 'caja']
    });

    return gastos;
  }

  async findOne(id: string): Promise<Gasto> {
    const gasto = await this.gastoRepository.findOne({
      where: { id },
      relations: ['usuario', 'categoria', 'almacen'],
    });

    if (!gasto) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado.`);
    }

    return gasto;
  }

  async update(id: string, updateGastoDto: UpdateGastoDto): Promise<Gasto> {
    const gasto = await this.findOne(id);

    const { usuarioId, categoriaId, almacen, ...rest } = updateGastoDto;

    if (usuarioId) {
      const usuario = await this.userRepository.findOne({ where: { id: usuarioId } });
      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
      }
      gasto.usuario = usuario;
    }

    if (categoriaId) {
      const categoria = await this.categoriaRepository.findOne({ where: { id: categoriaId } });
      if (!categoria) {
        throw new NotFoundException(`Categoría con ID ${categoriaId} no encontrada.`);
      }
      gasto.categoria = categoria;
    }
    if (gasto?.almacen?.id && gasto?.almacen?.id !== almacen) {
      const almacenD = await this.almacenService.findOne(almacen);
      if (!almacenD) {
        throw new NotFoundException(`Almacen con ID ${categoriaId} no encontrada.`);
      }
      gasto.almacen = almacenD;
    }

    Object.assign(gasto, rest);

    return await this.gastoRepository.save(gasto);
  }

  async remove(id: string): Promise<void> {
    const gasto = await this.findOne(id);
    await this.gastoRepository.remove(gasto);
  }
  async getGastosCount(): Promise<number> {
    return this.gastoRepository.count();
  }
}
