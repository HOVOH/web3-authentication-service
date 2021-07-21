import { Test } from "@nestjs/testing";
import { EnvironmentModule } from "@hovoh/nestjs-environment-module";
import { DatabaseModule } from "../src/database/database.module";
import { VerificationModule } from "../src/verification/verification.module";
import { VerificationService } from "../src/verification/verification.service";
import { INestApplication } from "@nestjs/common";
import { DEAD_ADDRESS } from "./test-helper";
import { Repository } from "typeorm";
import { VerificationCode } from "../src/verification/verification-code.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import moment from "moment";

describe("Verification module",() => {

  let verificationService: VerificationService;
  let verificationRepo: Repository<VerificationCode>;
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [EnvironmentModule, DatabaseModule, VerificationModule],
    }).compile()
    verificationService = module.get<VerificationService>(VerificationService);
    verificationRepo = module.get<Repository<VerificationCode>>(getRepositoryToken(VerificationCode));
    app = module.createNestApplication();
    await app.init();
  })

  afterEach(async () => {
    await verificationRepo.delete({});
  })

  it("verification service should be defined", () => {
    expect(verificationService).toBeDefined()
  })

  it("should generate a verification code and save it", async () => {
    expect(await verificationService.generateEthVerificationCode(DEAD_ADDRESS)).toBeTruthy()
    expect(await verificationService.findEthCode(DEAD_ADDRESS)).toBeTruthy()
  })

  it("Should not find a code", async () => {
    const code = await verificationService.generateEthVerificationCode("0x00000");
    expect(await verificationService.findEthCode(DEAD_ADDRESS)).toBeFalsy()
  })

  it("Should use the code", async () => {
    const code = await verificationService.generateEthVerificationCode(DEAD_ADDRESS);
    await verificationService.useCode(code);
    expect((await verificationRepo.findOne({identifier: DEAD_ADDRESS})).used).toBe(true);
  })

  it("Should not find a used code", async () =>{
    const code = await verificationService.generateEthVerificationCode(DEAD_ADDRESS);
    await verificationService.useCode(code);
    expect(await verificationService.findEthCode(DEAD_ADDRESS)).toBeFalsy();
  })

  it("Should not find an expired code", async () => {
    const code = await verificationService.generateEthVerificationCode(DEAD_ADDRESS);
    code.createdAt = new Date(Date.now()-16*60*1000);
    await verificationRepo.save(code);
    expect(await verificationService.findEthCode(DEAD_ADDRESS)).toBeFalsy();
  })

  afterAll(async () => {
    await app.close()
  })
})
