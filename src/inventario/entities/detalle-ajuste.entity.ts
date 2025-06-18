import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AjusteInventario } from "./ajustes-inventario.entity";
import { Producto } from "src/productos/entities/producto.entity";

@Entity('detalle_ajuste')
export class DetalleAjuste {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AjusteInventario, ajuste => ajuste.detalles)
  @JoinColumn({ name: 'ajuste_inventario_id' })
  ajuste_inventario: AjusteInventario;

  @Column('uuid',{nullable:true})
  producto_id: string;

  @ManyToOne(() => Producto, { eager: false, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column('int')
  cantidad: number;

  @Column('text')
  unidad_medida: string;

  @Column('text')
  tipo: string;

  @Column({ type: 'jsonb', nullable: true })
  producto_snapshot?: Record<string, any>;

  // Campo transitorio para el stock
  stock?: number;
}
