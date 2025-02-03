import { CreateAlmacenDto } from "src/almacenes/dto/create-almacen.dto";
import { CreateUserDto } from "src/auth/dto";


export const createUserSeed: CreateUserDto = {
  username: "admin",
  password: "Items@123*",
  fullName: "Items.bo",
  celular: "75915881",
  roles: ["admin"],
};

export const createAlmacen: CreateAlmacenDto = {
  nombre: 'Central',
  encargado: 'Administrador',
  ubicacion: 'Central'
};
