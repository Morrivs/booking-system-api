import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BookingsService {
  private readonly expirationHours: number;
  private readonly logger = new Logger(BookingsService.name);
  constructor(
    private prisma:PrismaService, 
    private config: ConfigService,
    private eventEmitter: EventEmitter2
  ){

    this.expirationHours = this.config.get<number>('EXPIRATION_HOURS', 24);

    if (isNaN(this.expirationHours)) {
      throw new Error('BOOKING_PENDING_EXPIRATION_HOURS is not defined');
    }
  }

  async create(userId: string, dto: CreateBookingDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.hostId === userId) {
      throw new ForbiddenException('You cannot book your own property');
    }

    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        propertyId: dto.propertyId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        AND: [
          { startDate: { lt: endDate } },
          { endDate: { gt: startDate } },
        ],
      },
    });

    if (overlappingBooking) {
      throw new BadRequestException(
        'Property is already booked for these dates',
      );
    }

    const booking = await this.prisma.booking.create({
      data: {
        userId,
        propertyId: dto.propertyId,
        startDate,
        endDate,
        status: BookingStatus.PENDING,
      },
      include: {
        user: {
          select:{
            id:true,
            name:true
          }
        },
        property: {
          include: {
            host: {
              select:{
              id:true,
              name:true
            }
          } 
        },
      },
      },
    });

    this.eventEmitter.emit('booking.created', booking);

    return booking;
  }

  findMine(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        property: true,
      },
    });
  }

  async confirmBooking(hostId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.property.hostId !== hostId) {
      throw new ForbiddenException(
        'You are not allowed to confirm this booking',
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        'Only pending bookings can be confirmed',
      );
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
      include: {
        user:{
          select:{
            id:true,
            name:true
          }
        },
        property: {
          include: { host:{
            select:{
              id:true,
              name:true
            }
           }},
        },
      },
    });

    // 📣 EVENTO
    this.eventEmitter.emit('booking.confirmed', updatedBooking);

    return updatedBooking;
  }

  async rejectBooking(hostId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.property.hostId !== hostId) {
      throw new ForbiddenException(
        'You are not allowed to reject this booking',
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        'Only pending bookings can be rejected',
      );
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cancelExpiredPendingBookings() {
    const expirationDate = new Date();
    expirationDate.setHours(
      expirationDate.getHours() - Number(this.expirationHours),
    );

    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: expirationDate },
      },
      include: {
        user: true,
        property: true,
      },
    });

    for (const booking of expiredBookings) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      });

      // 📣 Emitimos el evento
      this.eventEmitter.emit(
        'booking.pending.expired',
        booking,
      );
    }

    if (expiredBookings.length > 0) {
      this.logger.log(
        `✅ ${expiredBookings.length} reservas PENDING expiradas fueron canceladas`,
      );
    }
  }

  async findForHost(hostId: string) {
    return this.prisma.booking.findMany({
      where: {
        property: {
          hostId,
        },
      },
      include: {
        user: true,
        property: true,
      },
    });
  }

  async cancelByGuest(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking || booking.userId !== userId) {
      throw new ForbiddenException();
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be cancelled');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
  }

}
