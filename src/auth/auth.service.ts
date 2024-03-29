import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs'
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwtPayload';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService
  ) {

  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { password, ...userData } = createUserDto

      const newUser = new this.userModel({
        password: bcrypt.hashSync(password, 10),
        ...userData
      })
      await newUser.save()
      const { password: ignore, ...visibleData } = newUser.toJSON()
      console.log(visibleData)
      return visibleData
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(`${createUserDto.email} already exists`)
      }
      throw new InternalServerErrorException('something went wrong')
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto
    const user = await this.userModel.findOne({ email })
    if (!user) {
      throw new UnauthorizedException('Not Valid Email')
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Not Valid Password')
    }

    const { password: ignore, ...rest } = user.toJSON()

    return {
      ...rest,
      token: await this.getToken({ id: user.id })
    }
  }

  async register(registerData: RegisterDto) {
    const newUser = await this.create(registerData)
    const { password, ...rest } = newUser
    const { id } = await this.userModel.findOne({ email: registerData.email })
    return {
      ...rest,
      token: await this.getToken({ id })
    }
  }

  
  findAll() : Promise<User[]> {
    return this.userModel.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }
  
  async findById(id : string) {
    const user = await this.userModel.findById(id)
    const {password, ...rest} = user.toJSON(); // exclude pass and id
    return rest
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  getToken(payload: JwtPayload) {
    return this.jwtService.signAsync(payload)
  }
}
