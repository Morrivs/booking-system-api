import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryProvider } from './Cloudinary.provider';

@Module({
  providers: [CloudinaryService, CloudinaryProvider],
  imports: [ConfigModule],
  exports: [CloudinaryService, CloudinaryProvider],
})
export class CloudinaryModule {}
