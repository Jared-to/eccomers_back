import { Producto } from "src/productos/entities/producto.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Pedido } from "./pedido.entity";


@Entity('detalle_pedido')
export class DetallePedido {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Producto, { eager: false, nullable: true, onDelete: 'SET NULL', })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column('text')
  variante: string;

  @Column({ type: 'jsonb', nullable: true })
  producto_snapshot?: Record<string, any>;

  @Column('int')
  cantidad: number;

  @Column('int')
  precio: number;

  @Column('text')
  unidad_medida: string;

  @Column('float')
  subtotal: number;

  @ManyToOne(() => Pedido, (venta) => venta.detalles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;
}