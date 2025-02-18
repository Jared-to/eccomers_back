import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('config_sistems')
export class Config {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  imagenQR: string;

  @Column('text', { nullable: true })
  linkFacebook: string;

  @Column('text', { nullable: true })
  linkInstagram: string;

  @Column('text', { nullable: true })
  linkTiktok: string;

  @Column('text', { nullable: true })
  telefonoPrincipal: string;

  @Column('boolean', { default: true })
  estado: boolean;
}
