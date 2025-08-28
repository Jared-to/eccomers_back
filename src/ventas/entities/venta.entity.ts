import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { DetalleVenta } from "./detalle-venta.entity";
import { Cliente } from "src/clientes/entities/cliente.entity";
import { Caja } from "src/cajas/entities/caja.entity";
import { User } from "src/auth/entities/user.entity";
import { Almacen } from "src/almacenes/entities/almacen.entity";
import { Descuento } from "src/descuentos/entities/descuento.entity";
import { QrGenerados } from "./qr-generados.entity";

@Entity('ventas')
export class Venta {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', generated: 'increment', unique: true })
  increment: number;

  @Column({ type: 'text', unique: true, nullable: true })
  codigo: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fecha: Date;


  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fechaEdit: Date;

  @ManyToOne(() => Cliente, cliente => cliente.ventas, { nullable: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ type: 'text', nullable: true })
  nombreCliente: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'usuario_id' })
  vendedor: User;

  @ManyToOne(() => Almacen, { eager: false })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

  @ManyToOne(() => Descuento, { eager: false, nullable: true })
  @JoinColumn({ name: 'descuento' })
  descuento: Descuento;

  @Column('float')
  subtotal: number;

  @Column('float')
  total: number;

  @Column('float', { nullable: true })
  montoQR: number;

  @Column('float', { nullable: true })
  montoEfectivo: number;

  @Column('text', { nullable: true })
  nombreDescuento: string;

  @Column('float', { nullable: true })
  porcentajeDescuento: number;

  @Column('text', { nullable: true })
  glosa: string;

  @Column({ type: 'enum', enum: ['EFECTIVO', 'QR', 'QR-EFECTIVO'], default: 'EFECTIVO' })
  tipo_pago: string;

  @Column('float', { nullable: true })
  montoRecibido: number;

  @Column({ type: 'bool', default: false })
  ventaAlContado: boolean;


  @OneToMany(() => DetalleVenta, (detalleVenta) => detalleVenta.venta,)
  detalles: DetalleVenta[];

  @OneToOne(() => QrGenerados, (qrGenerados) => qrGenerados.venta,)
  qr: QrGenerados;

  // Relación muchos a uno
  @ManyToOne(() => Caja, (caja) => caja.ventas, {
    nullable: false, // Hace obligatorio que cada venta tenga una caja
  })
  caja: Caja;


  @Column('boolean', { default: true })
  estado: boolean;


}
