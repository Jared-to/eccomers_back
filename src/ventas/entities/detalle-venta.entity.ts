import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Venta } from "./venta.entity";
import { Producto } from "src/productos/entities/producto.entity";
import { Almacen } from "src/almacenes/entities/almacen.entity";

@Entity('detall_venta')
export class DetalleVenta {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Venta, (venta) => venta.detalles, {
    onDelete: 'CASCADE', 
    onUpdate: 'CASCADE', 
  })
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @ManyToOne(() => Producto, { eager: false })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => Almacen, { eager: false })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

    
  @Column('float')
  precio: number;

  @Column('int')
  cantidad: number;

  @Column('text')
  codigo_barras: string;

  @Column('text')
  unidad_medida: string;

  @Column('float')
  descuento: number;

  @Column('float')
  subtotal: number;


}
