import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { MailService } from "../helpers/mail/MailService";
import * as bookingEvents from "../events/booking.events";
import { bookingExpiredTemplate } from "../helpers/mail/templates/booking.-expired.template";
import { bookingConfirmedTemplate } from "../helpers/mail/templates/booking.-confirmed.template";
import { bookingCancelledTemplate } from "../helpers/mail/templates/booking.-canceled.template";
import { bookingCreatedTemplate } from "../helpers/mail/templates/booking.-created.template";
import { Booking } from "@prisma/client";


@Injectable()
export class BookingEventsListener {

  constructor(
    private readonly mailService: MailService,
  ) {}

  @OnEvent('booking.created')
  async handleBookingCreated(event: bookingEvents.BookingCreatedEvent) {

    const html = bookingCreatedTemplate({
      guestName: event.guestName,
      propertyTitle: event.propertyTitle,
      startDate: event.startDate,
      endDate: event.endDate,
    });

    await this.mailService.sendMail({
      to: event.hostEmail,
      subject: 'Nueva solicitud de reserva',
      html,
    });
  }

  @OnEvent('booking.confirmed')
  async handleBookingConfirmed(event:bookingEvents.BookingConfirmedEvent) {

    const html = bookingConfirmedTemplate({
      propertyTitle: event.propertyTitle,
      startDate: event.startDate,
      endDate: event.endDate,
    });

    await this.mailService.sendMail({
      to: event.guestEmail,
      subject: 'Tu reserva fue confirmada',
      html,
    });
  }

  @OnEvent('booking.cancelled')
  async handleBookingCancelled(event: bookingEvents.BookingCancelledEvent) {

    const html = bookingCancelledTemplate({
      propertyTitle: event.propertyTitle,
    });

    await this.mailService.sendMail({
      to: event.email,
      subject: 'Reserva cancelada',
      html,
    });
  }

  @OnEvent('booking.pending.expired')
  async handleBookingExpired(event: bookingEvents.BookingExpiredEvent) {

    const html = bookingExpiredTemplate({
      propertyTitle: event.propertyTitle,
    });

    await this.mailService.sendMail({
      to: event.guestEmail,
      subject: 'Reserva expirada',
      html,
    });
  }
}