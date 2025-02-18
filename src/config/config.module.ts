import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Config } from './entities/config.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ConfigController],
  providers: [ConfigService],
  imports: [
    TypeOrmModule.forFeature([Config]),
    CloudinaryModule,
    AuthModule
  ]
})
export class ConfigModuleConfig { }
