import { Almacen } from 'src/almacenes/entities/almacen.entity';
import { Producto } from 'src/productos/entities/producto.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';


@Entity('movimientos_inventario')
export class MovimientoInventario {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Almacen,
    { onDelete: 'CASCADE' }
  )
  almacen: Almacen;

  @ManyToOne(() => Producto,
    { onDelete: 'CASCADE' }
  )
  product: Producto;

  @Column('text')
  tipo: string;

  @Column('int')
  cantidad: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fecha: Date;

  @Column('text', { nullable: true })
  descripcion: string;

  @Column('text', { nullable: true })
  codigo_barras: string;
}
