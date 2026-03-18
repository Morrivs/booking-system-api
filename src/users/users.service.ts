import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/common/enums/Role';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();  
  }

  async update(userId: string, data: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data,
      });
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }
  async becomeHost(userId:string){
    const userExists = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where:{id:userExists.id},
      data:{
        role:Role.HOST
      }
    })
  }
}
