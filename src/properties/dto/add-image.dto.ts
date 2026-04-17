import { IsArray, IsUrl } from "class-validator";

export class AddImagesDto {
  @IsArray()
  @IsUrl({}, { each: true })
  urls: string[];
}