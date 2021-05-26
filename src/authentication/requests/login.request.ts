import { EthereumAddress } from "../../utils/EthereumAddress";
import { IsEthereumAddress, IsString } from "class-validator";

export class LoginRequest {

  @IsEthereumAddress()
  address: EthereumAddress

  @IsString()
  password: string

}
