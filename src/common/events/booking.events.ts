export interface BookingCreatedEvent {
  hostEmail: string;
  guestName: string;
  propertyTitle: string;
  startDate: Date;
  endDate: Date;
}

export interface BookingConfirmedEvent {
  guestEmail: string;
  hostEmail: string;
  guestName: string;
  propertyTitle: string;
  startDate: Date;
  endDate: Date;
}

export interface BookingCancelledEvent {
  email: string;
  cancelledBy: 'HOST' | 'GUEST' | 'SYSTEM';
  propertyTitle: string;
  startDate: Date;
  endDate: Date;
}

export interface BookingExpiredEvent {
  guestEmail: string;
  propertyTitle: string;
  startDate: Date;
  endDate: Date;
}