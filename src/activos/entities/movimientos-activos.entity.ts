import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Activo } from "./activo.entity";
import { User } from "src/auth/entities/user.entity";


@Entity('movimientos-activos')
export class MovimientosActivos {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  glosa: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fecha: Date;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'enum', enum: ['ingreso', 'egreso'] })
  tipo: string;

  @ManyToOne(() => Activo,
    { onDelete: 'CASCADE' }
  )
  activo: Activo;

  @ManyToOne(() => User,)
  user: User;

}