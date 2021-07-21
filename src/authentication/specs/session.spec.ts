import { REFRESH_LENGTH, Session, SESSION_LENGTH } from "../session.entity";
import MockDate from 'mockdate';
import * as moment from "moment";
import { userFactory } from "../../users/specs/user.factory";
import { User } from "../../users/user.entity";
describe("Session", ()=>{
  describe("start", () => {
    it("should set dates", () =>{
      const session = new Session();
      session.start()
      expect(session.startedAt).toBeInstanceOf(Date);
      expect(session.validUntil).toBeInstanceOf(Date);
      expect(session.refreshableUntil).toBeInstanceOf(Date);
      expect(session.validUntil.valueOf()).toBeGreaterThan(session.startedAt.valueOf());
      expect(session.refreshableUntil.valueOf()).toBeGreaterThanOrEqual(session.validUntil.valueOf());
    })
  })

  describe("refresh", () => {

    afterEach(() => {
      MockDate.reset()
    })

    it("should throw an error if not started", () => {
      const session = new Session();
      expect(() => session.refresh()).toThrow('Session never started')
    })

    it("should throw an error if not refreshable", () => {
      const session = new Session();
      session.start();
      MockDate.set(moment(session.startedAt).add(REFRESH_LENGTH+1, 'm').toDate())
      expect(() => session.refresh()).toThrow();
    })

    it("should push validUntil by session length", () => {
      const session = new Session();
      session.start();
      const date = new Date();
      MockDate.set(date);
      session.refresh();
      const sessionEnd = moment(date).add(SESSION_LENGTH, 'm').toDate().valueOf();
      expect(session.validUntil.valueOf()).toEqual(sessionEnd);
    })

  })

  describe("refreshable", () => {
    afterEach(() => {
      MockDate.reset()
    })

    it("should not be refreshable if not started", () =>{
      const session = new Session();
      expect(session.refreshable()).toBeFalsy()
    })

    it("should return true if refreshable refreshable until < now", () => {
      const session = new Session();
      session.start();
      expect(session.refreshable()).toBeTruthy()
    })

    it("should return false if refreshable refreshable until > now", () => {
      const session = new Session();
      session.start();
      MockDate.set(moment(new Date()).add(REFRESH_LENGTH+1,'m').toDate());
      expect(session.refreshable()).toBeFalsy()
    })
  })

  describe("refreshToken", () => {
    it("should expose refresh secret and refreshable until", () =>{
      const session = new Session();
      const user = userFactory.build();
      session.userUuid = user.uuid;
      session.user = user as User;
      session.refreshSecret = 1337;
      session.start();
      const refreshToken = session.refreshToken() as Session;
      expect(refreshToken.user).toBeUndefined();
      expect(refreshToken.userUuid).toBeUndefined();
      expect(refreshToken.startedAt).toBeUndefined();
      expect(refreshToken.validUntil).toBeUndefined();
      expect(refreshToken.refreshSecret).toBeTruthy();
      expect(refreshToken.refreshableUntil).toBeTruthy();
    })
  })
  describe("accessToken", () => {
    it("should expose userUuid, startedAt and validUntil", () =>{
      const session = new Session();
      const user = userFactory.build();
      session.userUuid = user.uuid;
      session.user = user as User;
      session.refreshSecret = 1337;
      session.start()
      const refreshToken = session.accessToken() as Session;
      expect(refreshToken.user).toBeUndefined();
      expect(refreshToken.userUuid).toBeTruthy();
      expect(refreshToken.startedAt).toBeTruthy();
      expect(refreshToken.validUntil).toBeTruthy();
      expect(refreshToken.refreshSecret).toBeUndefined();
      expect(refreshToken.refreshableUntil).toBeUndefined();
    })
  })
})
