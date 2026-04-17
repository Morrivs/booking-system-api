import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseUUIDPipe, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/Role';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtRolesGuard } from 'src/common/guards/jwt-roles.guard';
import { AddImagesDto } from './dto/add-image.dto';
import { AnyFilesInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/common/providers/cloudinary/cloudinary.service';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService, 
    private readonly cloudinaryService: CloudinaryService) {}

  @Get()
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files')) // 'files' es el nombre del campo en el form-data
  async create(
    @Req() req, 
    @Body() dto: CreatePropertyDto, 
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    let imageUrls:string[] = [];

    if (files && files.length > 0) {
      const uploadPromises = files.map(file => this.cloudinaryService.uploadImage(file));
      const results = await Promise.all(uploadPromises);
      imageUrls = results.map(res => res.secure_url);
    }


    return this.propertiesService.create(req.user.userId, {
      ...dto,
      images: imageUrls
    });
  }

  @Get('my/properties')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.HOST, Role.ADMIN)
  findMine(@Req() req) {
    return this.propertiesService.findByHost(req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.HOST, Role.ADMIN)
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return await this.propertiesService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.HOST)
  async delete(@Req() req, @Param('id') id: string) {
    return await this.propertiesService.delete(req.user.userId, id);
  }

  @Post(':id/upload-image')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.HOST, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file')) 
  async uploadPropertyImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const result = await this.cloudinaryService.uploadImage(file);
    
    return this.propertiesService.addImages(id, req.user.userId, {
      urls: [result.secure_url],
    });
  }

  @Delete('images/:imageId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.HOST)
  async removeImage(@Param('imageId', ParseUUIDPipe) imageId: string, @Req() req) {
    await this.propertiesService.removeImage(imageId, req.user.userId);
    return {
      message: 'Imagen eliminada correctamente',
      id: imageId
    };
  }
}
