import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Config } from './entities/config.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { ConfigDto } from './dto/config.dto';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Config)
    private readonly configRepository: Repository<Config>,
    private readonly cloudinaryService: CloudinaryService
  ) { }
  async asignarQR(file: Express.Multer.File) {
    const config = await this.configRepository.findOne({ where: { estado: true } });
    let imageUrl;
    if (file) {
      if (config.imagenQR !== 'qr') {
        const publicId = this.extractPublicId(config.imagenQR);
        await this.cloudinaryService.deleteFile(publicId);
      }
      // Subir imágenes a Cloudinary
      const uploadPromises = await this.cloudinaryService.uploadFile(file);
      imageUrl = uploadPromises.secure_url;
    }
    config.imagenQR = imageUrl;

    return this.configRepository.save(config)
  }

  async updateConfig(updateConfigDto: ConfigDto): Promise<Config> {
    let config = await this.configRepository.findOne({ where: { estado: true } });
    if (!config) {
      config = this.configRepository.create();
    }
    Object.assign(config, updateConfigDto);
    return await this.configRepository.save(config);
  }
  async find() {
    const config = await this.configRepository.findOne({ where: { estado: true } });

    return config
  }

  private extractPublicId(url: string): string {
    const parts = url.split('/');
    const fileWithExtension = parts[parts.length - 1];
    return fileWithExtension.split('.')[0]; // Elimina la extensión para obtener el public_id
  }
}
