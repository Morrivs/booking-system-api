import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { UsersModule } from 'src/users/users.module';
import { CloudinaryModule } from 'src/common/providers/cloudinary/cloudinary.module';

@Module({
  imports:[UsersModule, CloudinaryModule],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
