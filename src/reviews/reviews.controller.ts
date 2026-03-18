import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Role } from 'src/common/enums/Role';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(Role.GUEST)
  create(
    @Req() req,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(req.user.userId, dto);
  }

  // ✏️ Editar review propia
  @Patch(':id')
  @Roles(Role.GUEST)
  update(
    @Req() req,
    @Param('id') reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(
      req.user.userId,
      reviewId,
      dto,
    );
  }

  // ❌ Eliminar review propia
  @Delete(':id')
  @Roles(Role.GUEST)
  remove(
    @Req() req,
    @Param('id') reviewId: string,
  ) {
    return this.reviewsService.remove(
      req.user.userId,
      reviewId,
    );
  }

  // 🌍 Reviews públicas de una propiedad
  @Get('property/:propertyId')
  findByProperty(
    @Param('propertyId') propertyId: string,
  ) {
    return this.reviewsService.findByProperty(propertyId);
  }
}
