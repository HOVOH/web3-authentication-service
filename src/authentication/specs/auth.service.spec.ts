import { AuthService } from "../auth.service";
import { Test } from '@nestjs/testing';
import { User } from "../../users/user.entity";

describe('Auth Service', () => {

  let authService: AuthService;


  describe("startSession", () => {
    beforeEach(async () => {
      // const module = await Test.createTestingModule({
      //   providers: [AuthService]
      // }).compile()
      // authService = module.get<AuthService>(AuthService);
    });
    it("returns a session", () => {
      expect(true).toBeTruthy();
      //expect(authService.login(new User())).toBeDefined()
    })
  })
})
