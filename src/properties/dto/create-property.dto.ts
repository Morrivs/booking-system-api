import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, IsUrl } from "class-validator";

export class CreatePropertyDto {
 @IsString() // <--- ¡Asegúrate de que esto esté!
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  pricePerNight: number;
    
    @IsArray()
    @IsUrl({}, { each: true }) // Valida que cada elemento sea una URL válida
    @IsOptional()
    images?: string[];
}
