import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Role } from 'src/common/enums/Role';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(Role.GUEST, Role.HOST)
  create(
    @Req() req,
    @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create( req.user.userId,createBookingDto);
  }

  @Get('me')
  @Roles(Role.GUEST, Role.HOST)
  getMyBookings(@Req() req) {
    return this.bookingsService.findMine(req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.HOST, Role.ADMIN)
  @Patch(':id/confirm')
  confirmBooking(@Req() req, @Param('id') id: string) {
    return this.bookingsService.confirmBooking(req.user.userId, id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.HOST, Role.ADMIN)
  @Patch(':id/reject')
  rejectBooking(@Req() req, @Param('id') id: string) {
    return this.bookingsService.rejectBooking(req.user.userId, id);
  }

  @Patch(':id/cancel')
  @Roles(Role.GUEST)
  cancelByGuest(@Req() req, @Param('id') bookingId: string) {
    return this.bookingsService.cancelByGuest(
      req.user.userId,
      bookingId,
    );
  }

  @Get('host')
  @Roles(Role.HOST)
  findForHost(@Req() req) {
    return this.bookingsService.findForHost(req.user.userId);
  }
}
