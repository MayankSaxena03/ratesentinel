import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  @Roles('admin')
  create(@Req() req, @Body() dto: CreateUserDto) {
    return this.userService.create(req.user.tenantId, dto);
  }

  @Get()
  @Roles('admin', 'developer')
  findAll(@Req() req) {
    return this.userService.findAll(req.user.tenantId);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(req.user.tenantId, id, dto);
  }

  @Patch(':id/role')
  @Roles('admin')
  updateRole(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.userService.updateRole(req.user.tenantId, id, dto.role);
  }

  @Patch(':id/status')
  @Roles('admin')
  updateStatus(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.updateStatus(req.user.tenantId, id, dto.status);
  }
}
