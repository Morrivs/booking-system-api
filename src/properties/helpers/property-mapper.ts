// src/properties/mappers/property.mapper.ts
import { Property } from '@prisma/client';
import { PropertyResponseDto } from '../dto/property-response.dto';
import { UserMapper } from 'src/users/mappers/user-mapper';

export class PropertyMapper {
  static toResponse(property: any): PropertyResponseDto {
    return {
      id: property.id,
      title: property.title,
      description: property.description,
      pricePerNight: property.pricePerNight,
      avgRating: property.avgRating,
      reviewCount: property.reviewCount,
      createdAt: property.createdAt,
      host: property.host
        ? UserMapper.toResponse(property.host)
        : undefined,
    };
  }

  static toResponseList(properties: any[]): PropertyResponseDto[] {
    return properties.map(this.toResponse);
  }
}