import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateAccountRequest{
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @IsOptional()
  username: string

}
