export class Booking {
    id: number;
    propertyId: number;
    userId: number;
    startDate: Date;
    endDate: Date;
    status: number; // 0: pending, 1: confirmed, 2: cancelled
}
