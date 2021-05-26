import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import { SerializeInterceptor } from '@hovoh/nestjs-api-lib';
import { ApplicationErrorsFilter } from '@hovoh/nestjs-application-error';
import { HttpStatus } from '@nestjs/common';
import { errors } from '@hovoh/nestjs-authentication-lib';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:8001',
      package: 'hovoh.authentication',
      protoPath: join(__dirname, 'authentication.proto'),
    },
  });
  await app.startAllMicroservicesAsync();
  app.use(cookieParser());
  app.useGlobalInterceptors(new SerializeInterceptor());
  app.useGlobalFilters(
    new ApplicationErrorsFilter({
      [errors.NO_ACCESS_TOKEN]: HttpStatus.UNAUTHORIZED,
      [errors.NO_REFRESH_TOKEN]: HttpStatus.UNAUTHORIZED,
      [errors.BAD_ACCESS_TOKEN]: HttpStatus.FORBIDDEN,
    }),
  );
  await app.listen(3000);
};

bootstrap();
