import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from '../../dto/create-group.dto';
import { UpdateGroupDto } from '../../dto/update-group.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Request() req, @Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(req.user.userId, createGroupDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.groupsService.findAll(req.user.userId);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.groupsService.getGroupStats(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.groupsService.findOne(+id, req.user.userId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(+id, req.user.userId, updateGroupDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    await this.groupsService.remove(+id, req.user.userId);
    return { message: 'Group deleted successfully' };
  }
}
