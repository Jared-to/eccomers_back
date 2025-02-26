import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Producto } from "./producto.entity";


@Entity()
export class VarianteProducto {

  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  nombre: string;  // Ejemplo: "Mediana", "Grande", "Pequeña"

  @Column('decimal', { precision: 10, scale: 2 })
  precio: string;  

  @ManyToOne(() => Producto, (producto) => producto.variantes)
  producto: Producto;
}