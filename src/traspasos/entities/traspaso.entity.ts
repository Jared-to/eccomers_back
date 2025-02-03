import { Almacen } from "src/almacenes/entities/almacen.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DetalleTraspaso } from "./detalleTraspaso.entity";
import { User } from "src/auth/entities/user.entity";

@Entity('traspasos')
export class Traspaso {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Almacen, { eager: false })
  @JoinColumn({ name: 'almacen_origen_id' })
  almacenOrigen: Almacen;

  @ManyToOne(() => Almacen, { eager: false })
  @JoinColumn({ name: 'almacen_destino_id' })
  almacenDestino: Almacen;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'usuario_id' })
  responsable: User;

  @Column('text')
  glosa: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fecha: Date;

  @OneToMany(() => DetalleTraspaso, (detalle) => detalle.traspaso, {
  })
  detalles: DetalleTraspaso[];
}
