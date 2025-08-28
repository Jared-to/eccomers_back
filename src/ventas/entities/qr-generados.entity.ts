import { Pedido } from "src/pedidos/entities/pedido.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Venta } from "./venta.entity";
import { ConfirmacionPagoQR } from "./confirmaciones-pago-qr.entity";


@Entity('qr_generados')
export class QrGenerados {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  //QR
  @Column('text', { nullable: true })
  QR_URL: string;

  @Column('text', { nullable: true })
  aliasQR: string;

  @Column('text', { nullable: true })
  codigo: string;

  @Column('text', { nullable: true })
  idQR: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fecha: Date

  @Column({ type: 'date', nullable: true })
  fechaExpiracion: Date;


  @Column('boolean', { default: false })
  confirmacion_pago: boolean;

  @OneToOne(() => Venta, (venta) => venta.qr, { nullable: true })
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @OneToOne(() => Pedido, (pedido) => pedido.qr, { nullable: true })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @OneToOne(() => ConfirmacionPagoQR, (confirmacion) => confirmacion.qr)
  confirmacionQR: ConfirmacionPagoQR;
}
