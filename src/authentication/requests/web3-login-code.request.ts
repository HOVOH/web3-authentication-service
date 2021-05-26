import { IsEthereumAddress } from "class-validator";

export class Web3LoginCodeRequest {
  @IsEthereumAddress()
  ethereumAddress: string
}
