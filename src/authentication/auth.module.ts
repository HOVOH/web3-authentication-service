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
import { AuthResolver } from './auth.resolver';
import { IEnv } from '../app.module';
import { AccessTokenGuard } from '@hovoh/nestjs-authentication-lib';
import { VerificationModule } from "../verification/verification.module";

@Global()
@Module({
  imports: [
    UsersModule,
    EnvironmentModule,
    TypeOrmModule.forFeature([Session]),
    JwtModule.registerAsync({
      imports: [EnvironmentModule],
      useFactory: ({ env }: EnvironmentService<IEnv>) => ({
        secret: env.JWT_SECRET,
        signOptions: { expiresIn: env.JWT_EXPIRES_IN },
      }),
      inject: [EnvironmentService],
    }),
    VerificationModule,
  ],
  providers: [AuthService, AccessTokenGuard],
  controllers: [AuthResolver],
  exports: [AccessTokenGuard, JwtModule],
})
export class AuthModule {}
