import { Test } from "@nestjs/testing";
import { AuthService } from "../src/authentication/auth.service";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { EnvironmentModule } from "@hovoh/nestjs-environment-module";
import { DatabaseModule } from "../src/database/database.module";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../src/users/user.entity";
import { Session } from "../src/authentication/session.entity";
import { UsersService } from "../src/users/users.service";
import { INestApplication } from "@nestjs/common";
import { Repository } from "typeorm";
import * as faker from 'faker';
import { userFactory } from "../src/users/specs/user.factory";

describe("Auth package", () => {

  let app: INestApplication;
  let usersRepo: Repository<User>;
  let sessionsRepo: Repository<Session>;
  let authService: AuthService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({secret: "secret"}),
        EnvironmentModule,
        DatabaseModule,
        TypeOrmModule.forFeature([User, Session]),
      ],
      providers: [AuthService, UsersService]
    }).compile()

    usersRepo = moduleRef.get<Repository<User>>(getRepositoryToken(User))
    sessionsRepo = moduleRef.get<Repository<Session>>(getRepositoryToken(Session));
    authService = moduleRef.get<AuthService>(AuthService);
    jwtService = moduleRef.get<JwtService>(JwtService);

    app = moduleRef.createNestApplication();
    await app.init();
  })
  afterEach(async () => {
    await sessionsRepo.delete({});
    await usersRepo.delete({});
  })

  it("validateCredentials() should return user if password is okay", async () => {
    const password = "password";
    const user = await authService.register(faker.finance.ethereumAddress(), "username", password);
    expect(await authService.validateCredentials(user.ethereumAddress, password)).toBeTruthy()
  })

  it("validateCredentials() should return null if password is not okay", async () => {
    const password = "password";
    const user = await authService.register(faker.finance.ethereumAddress(), "username", password);
    expect(await authService.validateCredentials(user.ethereumAddress, "wrong_password")).toBeNull()
  })

  it("login() should return a session", async () => {
    const user = await authService.register(faker.finance.ethereumAddress(), "username", "password");
    const session = await authService.login(user);
    expect(session).toBeTruthy()
    expect(await sessionsRepo.find({uuid: session.uuid})).toBeTruthy();
    expect(session.userUuid).toEqual(user.uuid);
    expect(session.refreshSecret).toBeDefined();
    expect(session.validUntil).toBeTruthy();
    expect(session.startedAt).toBeTruthy();
    expect(session.refreshableUntil).toBeTruthy();
  })

  it("login() should load user by eth address if not loaded", async () => {
    const user = await authService.register(faker.finance.ethereumAddress(), "username", "password");
    const unloadedUser = userFactory.build({uuid: null, ethereumAddress: user.ethereumAddress}) as User;
    const session = await authService.login(unloadedUser);
    expect(session.userUuid).toBe(user.uuid);
  })

  it("login() should insert the user is non-existing", async () => {
    const user = userFactory.build({uuid: undefined}) as User;
    const session = await authService.login(user);
    const insertedUser = await usersRepo.findOne({ethereumAddress: user.ethereumAddress})
    expect(insertedUser).toBeTruthy();
    expect(insertedUser.uuid).toBe(session.userUuid)
  })

  it("getSignedAccessToken() returns signed access token", async () => {
    const user = await authService.register(faker.finance.ethereumAddress(), "username", "password");
    const session = await authService.login(user);
    const sat = authService.getSignedAccessToken(session);
    const verifiedSession = jwtService.verify(sat) as Session;
    expect(verifiedSession.refreshSecret).toBeUndefined();
    expect(verifiedSession.validUntil).toBeDefined();
  })

  it("getSignedRefreshToken() returns signed refresh token", async () => {
    const user = await authService.register(faker.finance.ethereumAddress(), "username", "password");
    const session = await authService.login(user);
    const sat = authService.getSignedRefreshToken(session);
    const verifiedSession = jwtService.verify(sat) as Session;
    expect(verifiedSession.refreshSecret).toBeDefined();
  })

  it("isRegistered() return true if wallet is registered", async () => {
    const user = await authService.register(faker.finance.ethereumAddress(), "username", "password");
    expect(await authService.isRegistered(user.ethereumAddress)).toBe(true);
  })

  it("isRegistered() return false if wallet is not registered", async () => {
    expect(await authService.isRegistered(faker.finance.ethereumAddress())).toBe(false);
  })

  it("POST api/v1/login", ()=> {

  });

  afterAll(async () => app.close());

})
