import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity('pedido')
export class Pedido {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', generated: 'increment', unique: true })
  increment: number;

  @Column('text', {nullable: true})
  nombreSolicitante: string;

  @Column('text', {nullable: true})
  apellidoSolicitante: string;

  @Column('text', {nullable: true})
  numeroSolicitante: string;

  @Column('text', {nullable: true})
  nombreFactura: string;

  @Column('text', {nullable: true})
  nitCi: string;

  @Column('text', {nullable: true})
  tipoDocumento: string;

  @Column({ type: 'enum', enum: ['DELIVERY', 'RECOJO',], default: 'EFECTIVO' })
  formaEntrega: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fechaHoraRecojo: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fechaPedido: Date;

  @Column({ type: 'enum', enum: ['EFECTIVO', 'QR',], default: 'EFECTIVO' })
  metodoPago: string;

  @Column('float', {nullable: true})
  total: number;

  @Column('text', {nullable: true})
  fotoRecibo: string;
}
