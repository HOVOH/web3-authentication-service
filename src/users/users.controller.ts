import { UsersService } from './users.service';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '@hovoh/nestjs-authentication-lib';

@Controller('api/v1/users')
@UseGuards(AccessTokenGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

/*  @Get()
  async listUsers() {
    return this.usersService.findAll();
  }*/
}
