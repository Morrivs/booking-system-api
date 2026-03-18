import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/Role';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtRolesGuard } from 'src/common/guards/jwt-roles.guard';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

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
  create(@Req() req, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(req.user.userId, dto);
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
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.HOST)
  delete(@Req() req, @Param('id') id: string) {
    return this.propertiesService.delete(req.user.userId, id);
  }
}
