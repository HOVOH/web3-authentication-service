import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { IRefreshToken, Session } from './session.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationError } from '@hovoh/nestjs-application-error';
import {
  errors,
  SignedAccessToken,
  IAccessToken,
} from '@hovoh/nestjs-authentication-lib';
import { EthereumAddress } from "../utils/EthereumAddress";
import { ETHEREUM_ADDRESS_ALREADY_IN_USE } from "./error.codes";

export type SignedRefreshToken = string;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
  ) {}

  async register(address: EthereumAddress, username: string, password: string): Promise<User> {
    return await this.usersService.registerUser(address, username, password);
  }

  async validateCredentials(
    address: EthereumAddress,
    password: string,
  ): Promise<User | null> {
    const user = await this.usersService.findByEthAddress(address);
    if (user && (await user.comparePassword(password))) {
      return user;
    }
    return null;
  }

  async login(user: User): Promise<Session> {
    if (!user.uuid && user.ethereumAddress){
      const userFound = await this.usersService.findByEthAddress(user.ethereumAddress);
      if (userFound){
        user = this.usersService.merge(user, userFound);
      } else {
        user = await this.usersService.save(user);
      }
    }
    return await this.startSession(user);
  }

  private async startSession(user: User): Promise<Session> {
    let session = new Session();
    session.user = user;
    session.refreshSecret = ~~(Math.random() * 2147483646);
    session.start();
    session = await this.sessionsRepository.save(session);
    return session;
  }

  public getSignedAccessToken(session: Session): SignedAccessToken {
    return this.jwtService.sign(session.accessToken());
  }

  public getSignedRefreshToken(session: Session): SignedRefreshToken {
    return this.jwtService.sign(session.refreshToken(), {
      expiresIn: '86400s',
    });
  }

  verifyAccessToken(accessToken: SignedAccessToken): IAccessToken {
    try {
      return this.jwtService.verify(accessToken) as IAccessToken;
    } catch (e) {
      throw new ApplicationError(errors.BAD_ACCESS_TOKEN);
    }
  }

  async getSessionFromUuid(sessionUuid: string): Promise<Session | null> {
    return this.sessionsRepository.findOne({ uuid: sessionUuid });
  }

  async refreshSession(
    accessToken: SignedAccessToken,
    refreshToken: SignedRefreshToken,
  ): Promise<Session> {
    if (!accessToken) {
      throw new ApplicationError(errors.NO_ACCESS_TOKEN);
    }
    if (!refreshToken) {
      throw new ApplicationError(errors.NO_REFRESH_TOKEN);
    }
    const refreshPayload = this.jwtService.verify(
      refreshToken,
    ) as IRefreshToken;
    const accessPayload = this.jwtService.decode(accessToken) as IAccessToken;
    const session = await this.getSessionFromUuid(accessPayload.uuid);
    if (!session || session.refreshSecret !== refreshPayload.refreshSecret) {
      throw new ApplicationError(errors.BAD_REFRESH_TOKEN);
    }
    session.refresh();
    return await this.sessionsRepository.save(session);
  }

  async isRegistered(address: EthereumAddress): Promise<boolean>{
    return this.usersService.walletIsRegistered(address)
  }

}
