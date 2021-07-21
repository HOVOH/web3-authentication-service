import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { SerializeInterceptor, ValidationPipe } from "@hovoh/nestjs-api-lib";
import { ApplicationErrorsFilter } from '@hovoh/nestjs-application-error';
import { errors } from '@hovoh/nestjs-authentication-lib';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalInterceptors(new SerializeInterceptor());
  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalFilters(new ApplicationErrorsFilter(errors.authErrorStatusMap),);
  await app.listen(3000);
};

bootstrap();
