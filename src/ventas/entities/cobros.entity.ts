import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Venta } from "./venta.entity";
import { User } from "src/auth/entities/user.entity";


@Entity('cobros')
export class Cobros {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamp', { nullable: true })
  proximoPago: Date;

  @Column('float', { nullable: true })
  monto: number;

  @Column('float', { nullable: true })
  montoPagado: number;

  @Column('text', { nullable: true })
  diaPago: string;

  @Column('float', { nullable: true })
  porcentaje: number;

  @Column({ type: 'boolean', default: false })
  aprobado: boolean;

  @Column('text', { nullable: true })
  glosa: string;

  @Column('text', { nullable: true })
  detalle: string;

  @Column('text', { nullable: true })
  metodoPago: string;

  @Column('int', { nullable: true })
  cuotas: number;

  @Column('bool', { default: true })
  cobrado: boolean

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  fechaPago: Date;

  @ManyToOne(
    () => Venta, { nullable: true,onDelete:'CASCADE' }
  )
  venta: Venta;
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'usuario_id' })
  vendedor: User; //cobrador
}