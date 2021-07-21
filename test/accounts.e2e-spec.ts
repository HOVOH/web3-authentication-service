import { INestApplication } from "@nestjs/common";
import { UsersService } from "../src/users/users.service";
import { Test } from "@nestjs/testing";
import * as faker from 'faker';
import { AccountsController } from "../src/accounts/accounts.controller";
import { AccessTokenGuard, iAccessTokenFactory, FakeAccessTokenGuard} from "@hovoh/nestjs-authentication-lib";
import * as request from 'supertest';
import { EnvironmentModule } from "@hovoh/nestjs-environment-module";
import { DatabaseModule } from "../src/database/database.module";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../src/users/user.entity";
import { SerializeInterceptor } from "@hovoh/nestjs-api-lib";
import { Repository } from "typeorm";

describe("Accounts package", () => {

  let app: INestApplication;
  let usersService: UsersService;
  let accessTokenGuard: FakeAccessTokenGuard;
  let usersRepo: Repository<User>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EnvironmentModule,
        DatabaseModule,
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UsersService],
      controllers: [AccountsController]
    }).overrideGuard(AccessTokenGuard).useValue(new FakeAccessTokenGuard())
      .compile();

    usersService = moduleRef.get<UsersService>(UsersService);
    accessTokenGuard = moduleRef.get<AccessTokenGuard>(AccessTokenGuard) as FakeAccessTokenGuard;
    usersRepo = moduleRef.get<Repository<User>>(getRepositoryToken(User));


    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new SerializeInterceptor())
    await app.init();

  })

  beforeEach(() => {
    usersRepo.clear();
  })

  it("GET api/v1/account return user", async () => {
    const user = await usersService.registerUser(faker.finance.ethereumAddress());
    const session = iAccessTokenFactory({userUuid: user.uuid});
    accessTokenGuard.mockSession(session);
    return request(app.getHttpServer())
      .get("/api/v1/account")
      .then(response => {
        expect(response.body.uuid).toEqual(user.uuid);
        expect(response.body._password).toBeUndefined();
      })
  })

  it("POST api/v1/account should let user modify his account", async () => {
    const user = await usersService.registerUser(faker.finance.ethereumAddress());
    const session = iAccessTokenFactory({userUuid: user.uuid});
    accessTokenGuard.mockSession(session);
    await request(app.getHttpServer())
      .post("/api/v1/account")
      .send("username=test")
      .expect(201)

    const modUser = await usersService.findByUuid(user.uuid);
    expect(modUser.username).toBe("test");
  })

  it("POST api/v1/account should let user modify his password", async () => {
    const user = await usersService.registerUser(faker.finance.ethereumAddress(), "hello", "password");
    const session = iAccessTokenFactory({userUuid: user.uuid});
    accessTokenGuard.mockSession(session);
    await request(app.getHttpServer())
      .post("/api/v1/account")
      .send("password=test&username=world")
      .expect(201)

    const modUser = await usersService.findByUuid(user.uuid);
    expect(modUser.password).not.toBe("test"); // it should not be the plaintext password
    expect(modUser.password).not.toBe(user.password);
    expect(modUser.username).toBe("world");
  })

  afterAll(() => app.close())
})
