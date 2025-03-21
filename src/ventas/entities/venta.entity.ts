import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DetalleVenta } from "./detalle-venta.entity";
import { Cliente } from "src/clientes/entities/cliente.entity";
import { Caja } from "src/cajas/entities/caja.entity";
import { User } from "src/auth/entities/user.entity";
import { Cobros } from "./cobros.entity";
import { Almacen } from "src/almacenes/entities/almacen.entity";

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

  @ManyToOne(() => Cliente, cliente => cliente.ventas)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'usuario_id' })
  vendedor: User;

  @ManyToOne(() => Almacen, { eager: false })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;


  @Column('float')
  subtotal: number;

  @Column('float')
  total: number;

  @Column('float')
  descuento: number;

  @Column({ type: 'enum', enum: ['EFECTIVO', 'QR', 'TRANSFERENCIA'], default: 'EFECTIVO' })
  tipo_pago: string;


  @Column({ type: 'bool', default: false })
  ventaAlContado: boolean;

  @Column({ type: 'bool', default: true })
  estadoCobro: boolean;


  @Column('int', { nullable: true })
  cuotas: number;

  @OneToMany(() => DetalleVenta, (detalleVenta) => detalleVenta.venta,)
  detalles: DetalleVenta[];

  @OneToMany(
    () => Cobros,
    cobros => cobros.venta,
    { cascade: true }
  )
  cobros: Cobros[];
  // Relación muchos a uno
  @ManyToOne(() => Caja, (caja) => caja.ventas, {
    nullable: false, // Hace obligatorio que cada venta tenga una caja
  })
  caja: Caja;

}
