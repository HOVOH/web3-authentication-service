import { EnvironmentModule, EnvironmentService } from "@hovoh/nestjs-environment-module";
import { IEnv } from "../src/app.module";

class MockProvider<T>{
  provide: any;
  useValue: Partial<T>
}

export const DEAD_ADDRESS = "0x000000000000000000000000000000000000dead"
