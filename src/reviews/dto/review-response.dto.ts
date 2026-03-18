import { UserResponseDto } from "src/users/dto/user-response.dto";

export class ReviewResponseDto {
  id: string;
  rating: number;
  comment?: string;
  createdAt: Date;

  user?: UserResponseDto;
}