// src/reviews/mappers/review.mapper.ts
import { Review } from '@prisma/client';
import { ReviewResponseDto } from '../dto/review-response.dto';
import { UserMapper } from 'src/users/mappers/user-mapper';

export class ReviewMapper {
  static toResponse(review: any): ReviewResponseDto {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: review.user
        ? UserMapper.toResponse(review.user)
        : undefined,
    };
  }

  static toResponseList(reviews: any[]): ReviewResponseDto[] {
    return reviews.map(this.toResponse);
  }
}