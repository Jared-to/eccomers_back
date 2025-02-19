import { Producto } from "src/productos/entities/producto.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('categorias')
export class Categoria {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  nombre: string;

  @Column('text')
  descripcion: string;

  @Column('text', { nullable: true })
  image: string;

  @Column('boolean', { default: false })
  estado: boolean;


  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos: Producto[];
}
