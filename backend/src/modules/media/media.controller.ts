import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { ImageSearchService } from './image-search.service';
import { CreateMediaDto } from '../../dto/create-media.dto';
import { UpdateMediaDto } from '../../dto/update-media.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../types/authenticated-request.interface';
import { MediaFilters } from '../../types/media-filters.interface';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly imageSearchService: ImageSearchService,
  ) {}

  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createMediaDto: CreateMediaDto,
  ) {
    return this.mediaService.create(req.user.userId, createMediaDto);
  }

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('groupId') groupId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const filters: MediaFilters = {};

    if (groupId !== undefined) {
      filters.groupId = groupId === 'null' ? null : parseInt(groupId, 10);
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
  getCategories(@Request() req: AuthenticatedRequest) {
    return this.mediaService.getCategories(req.user.userId);
  }

  @Get('search')
  search(@Request() req: AuthenticatedRequest, @Query('q') query: string) {
    return this.mediaService.search(req.user.userId, query);
  }

  @Get('search-covers')
  async searchCovers(
    @Request() req: AuthenticatedRequest,
    @Query('query') query: string,
    @Query('page') page: string = '0',
  ) {
    if (!query) return [];

    try {
      return await this.imageSearchService.searchImages(
        query,
        parseInt(page, 10),
      );
    } catch (error) {
      console.error('Error in search-covers endpoint:', error);
      return [];
    }
  }

  @Post('download-cover')
  async downloadCover(
    @Request() req: AuthenticatedRequest,
    @Body() body: { url: string; thumbnail?: string },
  ) {
    return await this.imageSearchService.downloadImage(
      body.url,
      body.thumbnail,
    );
  }

  @Post('reset')
  async factoryReset(@Request() req: AuthenticatedRequest) {
    await this.mediaService.factoryReset(req.user.userId);
    return { message: 'Factory reset completed successfully.' };
  }

  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.mediaService.findOne(+id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return this.mediaService.update(+id, req.user.userId, updateMediaDto);
  }

  @Delete(':id')
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.mediaService.remove(+id, req.user.userId);
  }

  @Post(':id/files')
  addFile(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { url: string; type: 'image' | 'video' },
  ) {
    return this.mediaService.addFile(+id, req.user.userId, body.url, body.type);
  }

  @Delete('files/:fileId')
  removeFile(
    @Request() req: AuthenticatedRequest,
    @Param('fileId') fileId: string,
  ) {
    return this.mediaService.removeFile(+fileId, req.user.userId);
  }
}
