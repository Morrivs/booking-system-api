import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { connect } from 'http2';
import { BookingStatus } from '@prisma/client';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PropertiesService {
  constructor(private prisma:PrismaService, private userService:UsersService){}
  create(hostId: string, dto: CreatePropertyDto) {
    try{
    const result = this.prisma.property.create({
      data:{
        title:dto.title,
        description:dto.description,
        pricePerNight:dto.pricePerNight,
        hostId
      }
    });
    this.userService.becomeHost(hostId)
    return result;
  }catch(error){
    console.error("bobo",error)
  }
}

  findAll(){
    return this.prisma.property.findMany({
      include:{
        host:{
          select:{
            id:true,
            name:true
          }
        }
      }
    });
  }

  async findOne(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        host: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async findByHost(hostId: string) {
    return this.prisma.property.findMany({
      where: { hostId },
    });
  }

  async update(
    hostId: string,
    propertyId: string,
    dto: UpdatePropertyDto,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.hostId !== hostId) {
      throw new ForbiddenException('You cannot edit this property');
    }

    return this.prisma.property.update({
      where: { id: property.id },
      data: {
        title: dto.title,
        description: dto.description,
        pricePerNight: dto.pricePerNight,
      },
    });
  }

  async delete(hostId: string, propertyId: string) {
    // 🔎 Verificar que la propiedad exista y sea del host
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.hostId !== hostId) {
      throw new ForbiddenException(
        'You are not allowed to delete this property',
      );
    }

    // 🚫 Verificar bookings activos
    const activeBookings = await this.prisma.booking.findFirst({
      where: {
        propertyId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
      },
    });

    if (activeBookings) {
      throw new ForbiddenException(
        'Cannot delete property with active bookings',
      );
    }

    // 🗑️ Eliminar propiedad
    return this.prisma.property.delete({
      where: { id: propertyId },
    });
  }
  
}
