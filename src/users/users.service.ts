import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from "typeorm";
import { User } from './user.entity';
import { USERNAME_TAKEN } from './error.codes';
import { ApplicationError } from '@hovoh/nestjs-application-error';
import { EthereumAddress } from "../utils/EthereumAddress";
import { ETHEREUM_ADDRESS_ALREADY_IN_USE } from "../authentication/error.codes";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async registerUser(address: EthereumAddress, username?: string, password?: string): Promise<User> {
    let user = new User();
    user.username = username;
    user.password = password;
    user.ethereumAddress = address;
    try{
      const insertResult = await this.usersRepository
        .createQueryBuilder()
        .insert()
        .values(user)
        .execute();
      user = Object.assign(user, insertResult.raw[0]);
    } catch (sqlError){
      const userAccount = await this.findByEthAddress(address);
      if (userAccount){
        throw new ApplicationError(ETHEREUM_ADDRESS_ALREADY_IN_USE);
      } else {
        throw new ApplicationError(USERNAME_TAKEN);
      }
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ username });
  }

  async findByEthAddress(address: string): Promise<User | null>{
    return this.usersRepository.findOne({ethereumAddress: address});
  }

  async findByUuid(uuid: string): Promise<User | null> {
    return this.usersRepository.findOne({ uuid });
  }

  async findOne(user: Partial<User>) {
    return this.usersRepository.findOne(user);
  }

  async findAll(user: Partial<User> = {}) {
    return this.usersRepository.find(user);
  }

  async update(user: User, update: Partial<User>) {
    this.usersRepository.merge(user, update);
    await this.usersRepository.save(user);
    return user;
  }

  async updateFromUuid(uuid: string, update: Partial<User>) {
    return await this.usersRepository.update({ uuid }, update);
  }

  async save(user: User){
    return this.usersRepository.save(user);
  }

  async walletIsRegistered(address: EthereumAddress){
    return !!(await this.findByEthAddress(address));
  }

  merge(user0: User, user1: DeepPartial<User>){
    return this.usersRepository.merge(user0, user1);
  }

}
