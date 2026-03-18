// src/bookings/mappers/booking.mapper.ts
import { Booking } from '@prisma/client';
import { BookingResponseDto } from '../dto/booking-response.dto';
import { UserMapper } from 'src/users/mappers/user-mapper';
import { PropertyMapper } from 'src/properties/helpers/property-mapper';

export class BookingMapper {
  static toResponse(booking: any): BookingResponseDto {
    return {
      id: booking.id,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      createdAt: booking.createdAt,
      user: booking.user
        ? UserMapper.toResponse(booking.user)
        : undefined,
      property: booking.property
        ? PropertyMapper.toResponse(booking.property)
        : undefined,
    };
  }

  static toResponseList(bookings: any[]): BookingResponseDto[] {
    return bookings.map(this.toResponse);
  }
}