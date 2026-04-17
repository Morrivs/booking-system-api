import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { connect } from 'http2';
import { BookingStatus } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { AddImagesDto } from './dto/add-image.dto';
import { CloudinaryService } from 'src/common/providers/cloudinary/cloudinary.service';


@Injectable()
export class PropertiesService {
  constructor(private prisma:PrismaService, private userService:UsersService, private cloudinaryService: CloudinaryService){}
  create(hostId: string, dto: CreatePropertyDto) {
    try{
    const result = this.prisma.property.create({
      data:{
        title:dto.title,
        description:dto.description,
        pricePerNight:dto.pricePerNight,
        hostId,
        images: {
          create: dto.images?.map(url => ({ url })) || [],
        },
      },
      include:{
        images:true
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
        },
        images:{
          select:{
            url:true,
            id:true
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
        images: true,
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
      include:{
        images:true
      }
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

    return await this.prisma.property.update({
      where: { id: property.id },
      data: {
        title: dto.title,
        description: dto.description,
        pricePerNight: dto.pricePerNight,
      },
    });
  }

  async delete(hostId: string, propertyId: string) {
    // 1. 🔎 Verificar que la propiedad exista e incluir sus imágenes
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { images: true } // Traemos las imágenes para tener sus URLs
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.hostId !== hostId) {
      throw new ForbiddenException('You are not allowed to delete this property');
    }

    // 2. 🚫 Verificar bookings activos (tu lógica actual está perfecta)
    const activeBookings = await this.prisma.booking.findFirst({
      where: {
        propertyId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
    });

    if (activeBookings) {
      throw new ForbiddenException('Cannot delete property with active bookings');
    }

    // 3. ☁️ Borrar imágenes de Cloudinary
    if (property.images.length > 0) {
      const deletePromises = property.images.map(img => {
        const publicId = this.extractPublicId(img.url);
        return this.cloudinaryService.deleteImage(publicId);
      });
      
      // Usamos Promise.allSettled para que si falla el borrado de una imagen,
      // no detenga el proceso completo de eliminación
      await Promise.allSettled(deletePromises);
    }

    // 4. 🗑️ Eliminar propiedad de la DB
    // Gracias al Cascade Delete en Prisma, esto borrará las reviews y los registros de imágenes
    return this.prisma.property.delete({
      where: { id: propertyId },
    });
  }
  
  // properties.service.ts
  async addImages(propertyId: string, hostId: string, addImagesDto: AddImagesDto) {
    const { urls } = addImagesDto;

    // Usamos un update que solo se ejecutará si el ID de la propiedad 
    // coincide Y además el hostId es el correcto.
    return await this.prisma.property.update({
      where: { 
        id: propertyId,
        hostId: hostId // 🛡️ Validación de seguridad: el host debe ser el dueño
      },
      data: {
        images: {
          createMany: {
            data: urls.map((url) => ({ url })),
          },
        },
      },
      include: {
        images: true,
      },
    }).catch(() => {
      // Si la propiedad no existe o el hostId no coincide, Prisma lanzará un error
      throw new ForbiddenException('No tienes permiso para modificar esta propiedad o no existe');
    });
  }
  

  async removeImage(imageId: string, hostId: string) {
    // 1. Buscamos la imagen incluyendo la información de la propiedad a la que pertenece
    const image = await this.prisma.propertyImage.findUnique({
      where: { id: imageId },
      include: {
        property: true, // Esto nos permite acceder a property.hostId
      },
    });

    // 2. Si no existe la imagen
    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    // 3. 🛡️ Validación de seguridad: ¿Es el host el dueño de esta propiedad?
    if (image.property.hostId !== hostId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta imagen');
    }

    try {
      // 4. Extraer el public_id y borrar de Cloudinary
      const publicId = this.extractPublicId(image.url);
      await this.cloudinaryService.deleteImage(publicId);

      // 5. Borrar de la base de datos (Prisma)
      return await this.prisma.propertyImage.delete({
        where: { id: imageId },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al eliminar la imagen del servidor');
    }
  }

  extractPublicId(url: string): string {
    const parts = url.split('/');
    const lastPart = parts.pop(); // "nombre_imagen.jpg"
    if (lastPart === undefined) {
      throw new Error('Invalid URL format');
    }
    return lastPart.split('.')[0]; // "nombre_imagen"
  }
}
