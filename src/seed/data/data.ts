import { CreateAlmacenDto } from "src/almacenes/dto/create-almacen.dto";
import { CreateUserDto } from "src/auth/dto";
import { CreateCategoriaDto } from "src/categorias/dto/create-categoria.dto";
import { CreateClienteDto } from "src/clientes/dto/create-cliente.dto";


export const createUserSeed: CreateUserDto = {
  username: "admin",
  password: "Items@123*",
  fullName: "Items.bo",
  celular: "75915881",
  roles: ["admin"],
  foto: 'https://res.cloudinary.com/dhdxemsr1/image/upload/v1740754107/vqjnmszqdhwhsqdprgwn.jpg'
};

export const createAlmacen: CreateAlmacenDto = {
  nombre: 'Central',
  ubicacion: 'Central'
};

export const createCliente: CreateClienteDto = {
  nombre: 'Cliente X',
  apellido: 'Cliente X',
  direccion: 'Central',
  telefono: '',
};

export const createCategoria: CreateCategoriaDto = {
  descripcion: 'Categoria Incial',
  nombre: 'General',
};
