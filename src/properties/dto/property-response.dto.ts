import { UserResponseDto } from "src/users/dto/user-response.dto";

export class PropertyResponseDto {
  id: string;
  title: string;
  description?: string;
  pricePerNight: number;
  avgRating: number;
  reviewCount: number;
  createdAt: Date;

  host?: UserResponseDto;
}