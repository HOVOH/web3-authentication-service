import { UsersService } from "../src/users/users.service";
import { Repository } from "typeorm";
import { User } from "../src/users/user.entity";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { EnvironmentModule } from "@hovoh/nestjs-environment-module";
import { DatabaseModule } from "../src/database/database.module";
import { UsersController } from "../src/users/users.controller";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { DEAD_ADDRESS } from "./test-helper";
import { JwtModule } from "@nestjs/jwt";
import { ETHEREUM_ADDRESS_ALREADY_IN_USE } from "../src/authentication/error.codes";
import { USERNAME_TAKEN } from "../src/users/error.codes";

const JWT_SECRET = "secret";

describe("Users package", () => {
  let usersService: UsersService;
  let userRepo: Repository<User>;
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: {expiresIn: "600s"}
        }),
        EnvironmentModule,
        DatabaseModule,
        TypeOrmModule.forFeature([User])
      ],
      providers: [UsersService],
      controllers: [UsersController],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));

    app = module.createNestApplication();
    await app.init();
  })

  afterEach(async () => {
    await userRepo.delete({});
  })

  it("Should register a user (only eth address)", async () => {
    await usersService.registerUser(DEAD_ADDRESS);
    expect(await usersService.findByEthAddress(DEAD_ADDRESS)).toBeDefined();
  })

  it("Should register a user with password", async () => {
    const username = "username";
    const password = "password";
    await usersService.registerUser(DEAD_ADDRESS, username, password);
    const user = await usersService.findByUsername(username);
    expect(user).toBeDefined()
  })

  it("Should throw an error if eth address is already registered", async () =>{
    expect.assertions(1);
    await usersService.registerUser(DEAD_ADDRESS);
    try {
      await usersService.registerUser(DEAD_ADDRESS)
    } catch (error) {
      expect(error.message).toEqual(ETHEREUM_ADDRESS_ALREADY_IN_USE);
    }
  })

  it("Should throw an error if username is taken", async () => {
    expect.assertions(1);
    await usersService.registerUser(DEAD_ADDRESS, "hello");
    try {
      await usersService.registerUser("0x000", "hello")
    } catch (error){
      expect(error.message).toEqual(USERNAME_TAKEN);
    }
  })

  afterAll(async () => {
    await app.close()
  })

})
