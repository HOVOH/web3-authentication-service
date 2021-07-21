import { Injectable } from "@nestjs/common";
import { VerificationCode } from "./verification-code.entity";
import * as crypto from 'crypto';
import { InjectRepository } from "@nestjs/typeorm";
import { Raw, Repository } from "typeorm";
import { EthereumAddress } from "../utils/EthereumAddress";
import { ethers } from "ethers";

@Injectable()
export class VerificationService{

  constructor(@InjectRepository(VerificationCode)
              private codesRepository: Repository<VerificationCode>){

  }

  generateEthVerificationCode(address: EthereumAddress): Promise<VerificationCode> {
    const verification = new VerificationCode()
    verification.identifierType = "ethereumAddress";
    verification.identifier = address;
    verification.code = this.hashString(address);
    return this.codesRepository.save(verification);
  }

  hashString(string: string){
    const hmac = crypto.createHmac('sha256', this.randomString());
    return hmac.update(string).digest("hex");
  }

  randomString(size = 16){
    return crypto
      .randomBytes(size)
      .toString('base64')
      .slice(0, size)
  }

  findEthCode(address: EthereumAddress): Promise<VerificationCode>{
    return this.codesRepository.findOne({
      where:{
        identifierType: "ethereumAddress",
        identifier: address,
        used: false,
        createdAt: Raw((alias) => `${alias} >= NOW() - interval '15 minute' `)
      },
      order: {
        createdAt: "DESC",
      }
    })
  }

  useCode(verificationCode: VerificationCode): Promise<VerificationCode>{
    verificationCode.used = true;
    return this.codesRepository.save(verificationCode);
  }

  async verifySignedCode(address: EthereumAddress, signature: string){
      const code = await this.findEthCode(address);
      if (!code) {
        return false;
      }
      const signer = ethers.utils.verifyMessage(code.code, signature)
      return address === signer;
  }

}
