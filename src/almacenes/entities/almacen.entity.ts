import { User } from "src/auth/entities/user.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('almacenes')
export class Almacen {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  nombre: string;

  @Column('text', { nullable: true })
  ubicacion?: string;

  @Column('text', { nullable: true })
  telefono?: string;

  @Column('text', { nullable: true })
  HoraAtencion?: string;

  @Column('text', { nullable: true })
  linkGPS?: string;

  @Column('boolean', { default: false })
  estado?: boolean;

  // Relación OneToMany: Un almacén puede tener varios usuarios
  @OneToMany(() => User, usuario => usuario.almacen)
  usuarios: User[];
}
