import * as Factory from "factory.ts";
import { User } from "../user.entity";
import * as faker from 'faker';

type functionObj<T> = {
  [k in keyof T]: (index?: number) => T[k]
}

function factoryMaker<T>(objMaker: functionObj<Partial<T>>) {
  const factoryObj = Object.keys(objMaker)
    .reduce((acc, key) => acc[key] = Factory.each(objMaker[key]), {}) as T;
  return Factory.Sync.makeFactory<T>(factoryObj);
}

// export const userFactory = factoryMaker<User>({
//   ethereumAddress: faker.finance.ethereumAddress,
//   uuid: faker.random.uuid,
// }

export const userFactory = Factory.Sync.makeFactory<Partial<User>>({
  ethereumAddress: Factory.each((i) => faker.finance.ethereumAddress()),
  uuid: Factory.each((i) => faker.datatype.uuid)
})
