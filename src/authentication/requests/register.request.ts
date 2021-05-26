import { IsEthereumAddress, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { EthereumAddress } from "../../utils/EthereumAddress";

export class RegisterRequest {
  @IsEthereumAddress()
  address: EthereumAddress

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @IsOptional()
  username: string

  @IsString()
  @MinLength(8)
  @MaxLength(60)
  @IsOptional()
  password:string
}
