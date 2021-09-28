import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import {
  EnvironmentService,
  EnvironmentModule,
} from '@hovoh/nestjs-environment-module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { AuthController } from './auth.controller';
import { IEnv } from '../app.module';
import { AccessTokenGuard } from '@hovoh/nestjs-authentication-lib';
import { VerificationModule } from "../verification/verification.module";
import * as fs from "fs";
@Global()
@Module({
  imports: [
    UsersModule,
    EnvironmentModule,
    TypeOrmModule.forFeature([Session]),
    JwtModule.registerAsync({
      imports: [EnvironmentModule],
      useFactory: ({ env }: EnvironmentService<IEnv>) => ({
        publicKey: fs.readFileSync(env.JWT_PUBLIC_CERTIFICATE_PATH),
        privateKey: fs.readFileSync(env.JWT_PRIVATE_KEY_PATH),
        signOptions: { expiresIn: env.JWT_EXPIRES_IN, algorithm: "ES256"},
      }),

      inject: [EnvironmentService],
    }),
    VerificationModule,
  ],
  providers: [AuthService, AccessTokenGuard],
  controllers: [AuthController],
  exports: [AccessTokenGuard, JwtModule],
})
export class AuthModule {}
