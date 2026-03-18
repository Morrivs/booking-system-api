import { bookingStatus } from "src/common/enums/bookingStatus";
import { PropertyResponseDto } from "src/properties/dto/property-response.dto";
import { UserResponseDto } from "src/users/dto/user-response.dto";

export class BookingResponseDto {
  id: string;
  startDate: Date;
  endDate: Date;
  status: bookingStatus;
  createdAt: Date;

  property?: PropertyResponseDto;
  user?: UserResponseDto;
}