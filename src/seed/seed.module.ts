import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { AuthModule } from 'src/auth/auth.module';
import { AlmacenesModule } from 'src/almacenes/almacenes.module';
import { ClientesModule } from 'src/clientes/clientes.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports:[AuthModule,AlmacenesModule,ClientesModule]
})
export class SeedModule {}
