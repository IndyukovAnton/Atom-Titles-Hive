import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from '../../dto/create-media.dto';
import { UpdateMediaDto } from '../../dto/update-media.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  create(@Request() req, @Body() createMediaDto: CreateMediaDto) {
    return this.mediaService.create(req.user.userId, createMediaDto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('groupId') groupId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    
    if (groupId !== undefined) {
      filters.groupId = groupId === 'null' ? null : parseInt(groupId);
    }
    
    if (category) {
      filters.category = category;
    }
    
    if (search) {
      filters.search = search;
    }

    return this.mediaService.findAll(req.user.userId, filters);
  }

  @Get('categories')
  getCategories(@Request() req) {
    return this.mediaService.getCategories(req.user.userId);
  }

  @Get('search')
  search(@Request() req, @Query('q') query: string) {
    return this.mediaService.search(req.user.userId, query);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.mediaService.findOne(+id, req.user.userId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(+id, req.user.userId, updateMediaDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.mediaService.remove(+id, req.user.userId);
  }
}
