import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { bookingStatus } from 'src/common/enums/bookingStatus';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma:PrismaService){}

  // 📝 Crear review
  async create(userId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        review: true,
        property: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('You cannot review this booking');
    }

    if (booking.status !== bookingStatus.CONFIRMED || booking.endDate < new Date()) {
      throw new BadRequestException(
        'You can only review a completed booking',
      );
    }

    if (booking.review) {
      throw new BadRequestException(
        'This booking already has a review',
      );
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          bookingId: booking.id,
          userId,
          propertyId: booking.propertyId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      await this.recalculatePropertyRating(booking.propertyId, tx);
      return review;
    });
  }

  // 🏠 Reviews de una propiedad
  async findByProperty(propertyId: string) {
    return this.prisma.review.findMany({
      where: { propertyId },
      include: {
        user: {
          select:{
            id:true,
            name: true,
            email:true,
            role:true
          }
        },
      },
    });
  }

  //reviews del usuario
  async findMine(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: {
        property: true,
      },
    });
  }
  
  async update(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You cannot edit this review');
    }

    if (dto.rating && (dto.rating < 1 || dto.rating > 5)) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    await this.recalculatePropertyRating(review.propertyId);

    return updated;
  }
  
  async remove(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You cannot delete this review');
    }

    const deleted = await this.prisma.review.delete({
      where: { id: reviewId },
    });

    await this.recalculatePropertyRating(deleted.propertyId);
  }

  private async recalculatePropertyRating(
    propertyId: string, 
    tx?: Prisma.TransactionClient 
  ) {
    const client = tx || this.prisma;

    const stats = await client.review.aggregate({
      where: { propertyId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await client.property.update({
      where: { id: propertyId },
      data: {
        avgRating: stats._avg.rating ?? 0,
        reviewCount: stats._count.rating,
      },
    });
  }
}
