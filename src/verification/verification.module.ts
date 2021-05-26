import { Module } from "@nestjs/common";
import { VerificationService } from "./verification.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VerificationCode } from "./VerificationCode";

@Module({
  imports: [TypeOrmModule.forFeature([VerificationCode])],
  providers: [VerificationService],
  exports: [VerificationService]
})
export class VerificationModule{}
