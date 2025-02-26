import { Categoria } from "src/categorias/entities/categoria.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { VarianteProducto } from "./varianteProducto.entity";

@Entity('productos')
export class Producto {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', generated: 'increment', unique: true })
  increment: number;

  @Column({ type: 'text', unique: true, nullable: true })
  codigo: string;

  @Column('text', { nullable: true })
  alias: string;

  @Column('text')
  descripcion: string;

  @Column('text', { unique: true })
  sku: string;

  @Column('text', { nullable: true })
  marca: string;

  @Column('text', { nullable: true })
  unidad_medida: string;

  @Column('text', { nullable: true })
  imagen: string;

  @Column('boolean', { default: true })
  estado: boolean;

  // Relación muchos a uno
  @ManyToOne(() => Categoria, (categoria) => categoria.productos, {
    nullable: false, // Hace obligatorio que cada producto tenga una categoría
    onDelete: 'CASCADE', // Elimina los productos si se elimina la categoría
  })
  categoria: Categoria;

  @OneToMany(() => VarianteProducto, (variante) => variante.producto, { cascade: true })
  variantes: VarianteProducto[];
}
