import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BookingEventsListener } from './common/Listeners/BookingEventsListener';
import { MailService } from './common/helpers/mail/MailService';

@Module({
  imports: [AuthModule, UsersModule, PropertiesModule, BookingsModule, ReviewsModule, PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
  ],
  controllers: [],
  providers: [BookingEventsListener,MailService],
})
export class AppModule {}
