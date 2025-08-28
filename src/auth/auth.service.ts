import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt'
import { LoginUserDto, CreateUserDto, UpdateUserDto } from './dto';
import { JwtPayload } from './interface/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import axios from 'axios';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {

      const { password, almacen, ...userDate } = createUserDto;

      const user = this.userRepository.create({
        ...userDate,
        password: bcrypt.hashSync(password, 10),
        almacen: almacen ? { id: almacen } : null
      });

      await this.userRepository.save(user);
      delete user.password;

      return {
        ...user,
        token: this.getJwtToken({ id: user.id })
      };
    } catch (error) {
      this.handleDBErrors(error);

    }
  }

  async login(loginUserDto: LoginUserDto) {

    const { password, username } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['almacen'],
      select: { username: true, password: true, id: true, roles: true }
    });

    if (!user) {
      throw new UnauthorizedException('Credentials are not valid (username)')
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Credentials not valid (password)');
    }

    return {
      ...user,
      token: this.getJwtToken({ id: user.id })
    };

  }

  async getUsers() {
    const users = await this.userRepository.find(
      { relations: ['almacen'] }
    );

    if (!users) {
      return [];
    }

    return users;
  }

  async getUserTokenQR(): Promise<string> {

    const datos = {
      username: process.env.USERNAME_EMPRESA,
      password: process.env.PASSWORD_EMPRESA,
    }

    try {
      const responder = await axios.post("https://dev-sip.mc4.com.bo:8443/autenticacion/v1/generarToken", datos, { headers: { apikey: process.env.APIKEY_CORREO_EMPRESA } })

      return responder.data.objeto.token;


    } catch (error) {
      console.log(error.data);
    }
  }

  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['almacen']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const { password, almacen, ...userData } = updateUserDto;

    let user = await this.userRepository.preload({
      id: userId,
      ...userData,
      almacen: almacen ? { id: almacen } : null

    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Hash the password if provided
    if (password) {
      user.password = bcrypt.hashSync(password, 10);
    }

    await this.userRepository.save(user);
    delete user.password;

    return user;
  }


  async deactivateUser(userId: string) {
    const user = await this.getUserById(userId);

    user.isActive = !user.isActive;
    await this.userRepository.save(user);

    return { message: `User with ID ${userId} has been ${user.isActive ? 'activated' : 'desactivated'}` };
  }

  async deleteUser(userId: string) {
    const user = await this.getUserById(userId);

    if (user.fullName === 'Items.bo') {
      throw new Error('El usuario con el nombre "Items.bo" no se puede eliminar');
    }

    await this.userRepository.remove(user);

    return { message: `User with ID ${userId} has been deleted` };
  }

  async cheAuthStatus(user: User) {
    const datos = {
      username: process.env.USERNAME_EMPRESA,
      password: process.env.PASSWORD_EMPRESA,
    }

    try {
      const responder = await axios.post("https://dev-sip.mc4.com.bo:8443/autenticacion/v1/generarToken", datos, { headers: { apikey: process.env.APIKEY_CORREO_EMPRESA } })

      user.tokenQR = responder.data.objeto.token;
      await this.userRepository.save(user);
      return {
        ...user,
        token: this.getJwtToken({ id: user.id })
      }
    } catch (error) {
      console.log(error.data);

    }

  }

  private getJwtToken(payload: JwtPayload) {

    const token = this.jwtService.sign(payload);

    return token;

  }

  private handleDBErrors(error: any): never {

    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    console.log(error);

    throw new InternalServerErrorException('Please check server logs');

  }
} 
