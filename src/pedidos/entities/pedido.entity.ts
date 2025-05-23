import { User } from "src/auth/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DetallePedido } from "./productosPedido.entity";
import { Almacen } from "src/almacenes/entities/almacen.entity";
import { Venta } from "src/ventas/entities/venta.entity";


@Entity('pedido')
export class Pedido {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', generated: 'increment', unique: true })
  increment: number;

  @Column({ type: 'text', unique: true, nullable: true })
  codigo: string;

  @Column('text', { nullable: true })
  nombreSolicitante: string;

  @Column('text', { nullable: true })
  apellidoSolicitante: string;

  @Column('text', { nullable: true })
  numeroSolicitante: string;

  @Column('text', { nullable: true })
  nombreFactura: string;

  @Column('text', { nullable: true })
  nitCi: string;

  @Column('text', { nullable: true })
  tipoDocumento: string;

  @Column({ type: 'enum', enum: ['DELIVERY', 'RECOJO',] })
  formaEntrega: string;

  @Column({
    type: 'float8',
    array: true,
    nullable: true,
  })
  dir_gps: number[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fechaHoraRecojo: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fechaPedido: Date;

  @Column({ type: 'enum', enum: ['EFECTIVO', 'QR',] })
  metodoPago: string;

  @Column('float', { nullable: true })
  total: number;

  @Column('float', { nullable: true })
  delivery: number;

  @Column('text', { nullable: true })
  fotoRecibo: string;

  @Column('text', { nullable: true })
  glosa: string;

  @Column({ type: 'enum', enum: ['Solicitado', 'Aceptado', 'Vendido', 'Rechazado', 'Cancelado'], default: 'Solicitado' })
  estado: string;

  @Column({ type: 'boolean', default: false })
  vendido: boolean;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @ManyToOne(() => Almacen, { eager: false })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

  @ManyToOne(() => Venta, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @OneToMany(() => DetallePedido, (detalleVenta) => detalleVenta.pedido,)
  detalles: DetallePedido[];
}
