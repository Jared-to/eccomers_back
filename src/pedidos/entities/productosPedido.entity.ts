import { Producto } from "src/productos/entities/producto.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity('detall_pedido')
export class DetallePedido {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Producto, { eager: false })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column('int')
  cantidad: number;

  @Column('text')
  unidad_medida: string;

  @Column('float')
  subtotal: number;
}