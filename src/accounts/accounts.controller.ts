import { Body, Controller, Get, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ReqSession, Session, AccessTokenGuard } from "@hovoh/nestjs-authentication-lib";
import { UsersService } from "../users/users.service";
import { UpdateAccountRequest } from "./update-account.request";

@Controller("v1/account")
@UseGuards(AccessTokenGuard)
export class AccountsController {

  constructor(private usersService: UsersService) {
  }

  @Get()
  async whoami(@ReqSession() session: Session){
    return this.usersService.findByUuid(session.userUuid);
  }

  @Post()
  async update(@ReqSession() session: Session, @Body() body: UpdateAccountRequest){
    await this.usersService.updateFromUuid(session.userUuid, body)
  }

}
