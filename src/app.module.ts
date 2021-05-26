import { Module } from '@nestjs/common';
import { AuthModule } from './authentication/auth.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { APP_PIPE } from "@nestjs/core";
import { ValidationPipe } from "@hovoh/nestjs-api-lib";
import { AccountsModule } from "./accounts/accounts.module";

export interface IEnv {
  ENVIRONMENT: 'prod' | 'dev' | 'test';
  DB_TYPE: 'postgres';
  DB_USER: string;
  DB_PASSWORD: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REGISTRATIONS_OPEN: string;
}

@Module({
  imports: [AuthModule, DatabaseModule, UsersModule, AccountsModule],
  controllers: [],
  providers: [{
    provide: APP_PIPE,
    useClass: ValidationPipe,
  }],
})
export class AppModule {}
