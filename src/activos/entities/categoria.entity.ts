import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Activo } from "./activo.entity";


@Entity('categoria-activo')
export class CategoriaActivo {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @OneToMany(() => Activo, (activo) => activo.categoria)
  activo: Activo;
}