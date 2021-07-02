import { AuthService } from './auth.service';
import { Body, Controller, Get, HttpStatus, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { Response, Request } from 'express';
import { USERNAME_TAKEN } from '../users/error.codes';
import { Session } from './session.entity';
import { errors, ACCESS_COOKIE_NAME, ReqSession, AccessTokenGuard } from "@hovoh/nestjs-authentication-lib";
import {
  CatchApplicationError,
  ApplicationError,
} from '@hovoh/nestjs-application-error';
import { LoginRequest } from "./requests/login.request";
import { RegisterRequest } from "./requests/register.request";
import { EnvironmentService } from "@hovoh/nestjs-environment-module";
import { IEnv } from "../app.module";
import { ETHEREUM_ADDRESS_ALREADY_IN_USE, REGISTRATIONS_CLOSE } from "./error.codes";
import { VerificationService } from "../verification/verification.service";
import { Web3LoginCodeRequest } from "./requests/web3-login-code.request";
import { Web3LoginRequest } from "./requests/web3-login.request";
import { User } from "../users/user.entity";
import { serialize } from "class-transformer";

const REFRESH_COOKIE_NAME = 'hovoh_refresh';
const SIGNATURE_DOES_NOT_MATCH = "signature_does_not_match_address";

@Controller('api/v1/authentication')
@CatchApplicationError({
  [errors.BAD_CREDENTIALS]: HttpStatus.UNAUTHORIZED,
  [REGISTRATIONS_CLOSE]: HttpStatus.FORBIDDEN,
  [ETHEREUM_ADDRESS_ALREADY_IN_USE]: HttpStatus.NOT_ACCEPTABLE,
  [SIGNATURE_DOES_NOT_MATCH]: HttpStatus.NOT_ACCEPTABLE,
  [USERNAME_TAKEN]: HttpStatus.NOT_ACCEPTABLE,
  [errors.NO_ACCESS_TOKEN]: HttpStatus.UNAUTHORIZED,
  [errors.NO_REFRESH_TOKEN]: HttpStatus.UNAUTHORIZED,
  [errors.BAD_REFRESH_TOKEN]: HttpStatus.UNAUTHORIZED
})
export class AuthController {
  constructor(private authService: AuthService,
              private envService: EnvironmentService<IEnv>,
              private verificationService: VerificationService) {}

  @Post('login')
  async login(
    @Body() args: LoginRequest,
    @Res() res: Response,
  ) {
    const user = await this.authService.validateCredentials(args.address, args.password);
    if (user) {
      const session = await this.authService.login(user);
      this.setAccessTokenInCookie(res, session);
      res.cookie(
        REFRESH_COOKIE_NAME,
        this.authService.getSignedRefreshToken(session),
        {
          httpOnly: true,
          expires: session.refreshableUntil,
          path: "api/v1/authentication/refresh-token"
        },
      );
      res.send(serialize(session.accessToken()));
    } else {
      throw new ApplicationError(errors.BAD_CREDENTIALS);
    }
  }

  setAccessTokenInCookie(res: Response, session: Session) {
    res.cookie(
      ACCESS_COOKIE_NAME,
      this.authService.getSignedAccessToken(session),
      {
        httpOnly: true,
        expires: session.refreshableUntil,
      },
    );
  }

  @Get('web3-login-code')
  async getWeb3LoginCode(@Query() req: Web3LoginCodeRequest){
    if (!this.envService.env.REGISTRATIONS_OPEN && !(await this.authService.isRegistered(req.ethereumAddress))){
      throw new ApplicationError(REGISTRATIONS_CLOSE)
    }
    return this.verificationService.generateEthVerificationCode(req.ethereumAddress);
  }

  @Post('web3-login')
  async web3Login(@Body() body: Web3LoginRequest, @Res() res: Response,){
    const signatureOk = await this.verificationService.verifySignedCode(body.ethereumAddress, body.signature);
    if (!signatureOk){
      throw new ApplicationError(SIGNATURE_DOES_NOT_MATCH)
    }
    const user = new User();
    user.ethereumAddress = body.ethereumAddress;
    const session = await this.authService.login(user);
    this.setAccessTokenInCookie(res, session);
    res.cookie(
      REFRESH_COOKIE_NAME,
      this.authService.getSignedRefreshToken(session),
      {
        httpOnly: true,
        expires: session.refreshableUntil,
      },
    );
    res.send(serialize(session.accessToken()));
  }


  @Post('register')
  async register(
    @Body() args: RegisterRequest,
  ) {
    if (this.envService.env.REGISTRATIONS_OPEN){
      const user = await this.authService.register(args.address, args.username, args.password);
    } else {
      throw new ApplicationError(REGISTRATIONS_CLOSE)
    }
  }

  @Post('validate/session')
  async validateSession(@Req() request: Request) {
    return this.authService.verifyAccessToken(
      request.cookies[ACCESS_COOKIE_NAME],
    );
  }

  @Post('refresh-token')
  async refreshToken(@Req() request: Request, @Res() res: Response) {
    const session = await this.authService.refreshSession(
      request.cookies[ACCESS_COOKIE_NAME],
      request.cookies[REFRESH_COOKIE_NAME],
    );
    this.setAccessTokenInCookie(res, session);
    res.send(serialize(session.accessToken()));
  }

  @Post('logout')
  @UseGuards(AccessTokenGuard)
  async logout(@ReqSession() session: Session, @Res() res: Response){
    res.cookie(
      REFRESH_COOKIE_NAME,
      "",
      {
        httpOnly: true,
        expires: new Date(),
      },
    );
    res.cookie(
      ACCESS_COOKIE_NAME,
      "",
      {
        httpOnly: true,
        expires: new Date(),
      },
    );
    res.status(200).send();
  }
}
