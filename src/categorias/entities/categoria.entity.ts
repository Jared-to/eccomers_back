import { Producto } from "src/productos/entities/producto.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

  @CreateDateColumn({ type: 'timestamp' })
  createAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updateAt: Date;

  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos: Producto[];
}
