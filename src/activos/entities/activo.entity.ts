import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CategoriaActivo } from "./categoria.entity";


@Entity('activos')
export class Activo {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', generated: 'increment', unique: true })
  increment: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  marca: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fechaAdquisicion: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  fechaVencimiento: Date;

  @Column({ type: 'text', nullable: true })
  proveedor: string;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'enum', enum: ['perecedero', 'noperecedero'] })
  tipo: string;

  // Relación muchos a uno
  @ManyToOne(() => CategoriaActivo, (categoria) => categoria.activo, {
    nullable: false, // Hace obligatorio que cada producto tenga una categoría
    onDelete: 'CASCADE', // Elimina los productos si se elimina la categoría
  })
  categoria: CategoriaActivo;
}
