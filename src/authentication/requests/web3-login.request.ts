import { IsEthereumAddress, IsString } from "class-validator";

export class Web3LoginRequest {
  @IsEthereumAddress()
  ethereumAddress: string;

  @IsString()
  signature: string
}
