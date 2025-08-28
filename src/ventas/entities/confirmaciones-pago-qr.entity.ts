import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { QrGenerados } from "./qr-generados.entity";

@Entity('confirmacion_pago_qr')
export class ConfirmacionPagoQR {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  alias: string;

  @Column('text', { nullable: true })
  numeroOrdenOriginante?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fechaproceso?: Date;

  @Column('text', { nullable: true })
  cuentaCliente?: string;

  @Column('text', { nullable: true })
  nombreCliente?: string;

  @Column('text', { nullable: true })
  documentoCliente?: string;


  @OneToOne(() => QrGenerados, (qrs) => qrs.confirmacionQR, { onDelete: 'CASCADE' })
  qr: QrGenerados;
}