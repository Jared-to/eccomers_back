// import { Product } from "src/products/entities";
import { Almacen } from "src/almacenes/entities/almacen.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity('users')
export class User {

  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('text', {
    unique: true,
  })
  username: string;
  @Column('text', {
    select: false
  })
  password: string;

  @Column({
    type: 'text',
  })
  fullName: string;
  @Column({
    type: 'text',
  })
  celular: string;
  @Column({
    type: 'bool',
    default: true
  })
  isActive: boolean;

  @Column('text', {
    array: true,
    default: ['user']
  })
  roles: string[];

  @Column('text', { nullable: true })
  foto: string;

  @Column({
    type: 'text',
    nullable: true
  })
  tokenQR: string;

  // Relación ManyToOne: Un usuario pertenece a un solo almacén
  @ManyToOne(() => Almacen, almacen => almacen.usuarios, { nullable: true })
  almacen: Almacen;

  @BeforeInsert()
  checkFieldBeforeEmail() {
    this.username = this.username.toLocaleLowerCase().trim();
  }

  @BeforeUpdate()
  checkFieldBeforeUpdate() {
    this.checkFieldBeforeEmail();
  }
}
