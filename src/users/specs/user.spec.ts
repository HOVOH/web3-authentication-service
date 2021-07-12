import { User } from "../user.entity";

describe("User entity", () => {
  it("should encrypt password", () => {
    const password = "password";
    const user = new User();
    user.password = password;
    expect(user.password).not.toEqual(password)
  })

  describe("comparePassword",  () => {
    it("should return true on correct password", async () => {
      const password = "password";
      const user = new User();
      user.password = password;
      expect(await user.comparePassword(password)).toStrictEqual(true)
    });

    it("should return false on incorrect password", async () => {
      const password = "password";
      const user = new User();
      user.password = password;
      expect(await user.comparePassword("not_the_password")).toStrictEqual(false);
    })

    it("should return false if no password", async () => {
      const user = new User();
      expect(await user.comparePassword("not_the_password")).toStrictEqual(false);
    })
  })
})
