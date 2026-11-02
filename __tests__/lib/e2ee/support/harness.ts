import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  generatePrivateKey,
  privateKeyToAccount,
  type PrivateKeyAccount,
} from "viem/accounts";

import { createE2eeEngine } from "@/lib/e2ee/engine";
import { createMemoryE2eeStorage, type E2eeStorage } from "@/lib/e2ee/storage";
import type {
  E2eeEngineExt,
  E2eeEngineOptions,
  E2eeMessage,
  E2eeScheduler,
  WasmModule,
} from "@/lib/e2ee/types";
import { loadMlsWasm, MLS_WASM_MANIFEST } from "@/lib/e2ee/wasm";
import {
  createFakeApiClient,
  createFakeDeliveryService,
  type FakeDeliveryService,
} from "@/tests/support/e2ee/fakeDeliveryService.cjs";

/**
 * Integration harness: real OpenMLS WASM, the shared fake delivery service,
 * memory storage and viem test wallets. Time is virtual: timers fire after a
 * scaled-down real delay and move the shared clock to their due time, so the
 * 5-30 s, 14-day and 20 s rules run in milliseconds.
 */

export class TestClock {
  private t: number;

  // Starts at the real time (minute aligned, like grants): OpenMLS stamps
  // KeyPackage lifetimes from the real clock, so a fixed start date drifts
  // further from those lifetimes every day and expiry stops lining up.
  constructor(start = Math.floor(Date.now() / 60_000) * 60_000) {
    this.t = start;
  }

  readonly now = (): number => this.t;

  advance(ms: number): void {
    this.t += ms;
  }

  setAtLeast(t: number): void {
    if (t > this.t) {
      this.t = t;
    }
  }
}

export interface WarpScheduler extends E2eeScheduler {
  pending(): number;
}

export function createWarpScheduler(clock: TestClock): WarpScheduler {
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  let next = 1;
  return {
    setTimeout(fire, ms) {
      const id = next;
      next += 1;
      const due = clock.now() + ms;
      const realMs = Math.min(40, Math.ceil(ms / 1000));
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id);
          clock.setAtLeast(due);
          fire();
        }, realMs)
      );
      return { id };
    },
    clearTimeout(handle) {
      const timer = timers.get(handle.id);
      if (timer !== undefined) {
        clearTimeout(timer);
        timers.delete(handle.id);
      }
    },
    pending: () => timers.size,
  };
}

let wasmPromise: Promise<WasmModule> | null = null;

export function loadTestWasm(): Promise<WasmModule> {
  wasmPromise ??= loadMlsWasm({
    bytes: new Uint8Array(
      readFileSync(join(process.cwd(), "public", MLS_WASM_MANIFEST.file))
    ),
  });
  return wasmPromise;
}

export interface TestDevice {
  profileId: string;
  engine: E2eeEngineExt;
  storage: E2eeStorage;
  signCalls: number;
  options: E2eeEngineOptions;
}

export interface TestUser {
  profileId: string;
  account: PrivateKeyAccount;
  devices: TestDevice[];
  primary: TestDevice;
}

export interface World {
  ds: FakeDeliveryService;
  clock: TestClock;
  scheduler: WarpScheduler;
  wasm: WasmModule;
  users: Map<string, TestUser>;
  devices: TestDevice[];
}

export async function createWorld(): Promise<World> {
  const clock = new TestClock();
  return {
    ds: createFakeDeliveryService({ now: clock.now }),
    clock,
    scheduler: createWarpScheduler(clock),
    wasm: await loadTestWasm(),
    users: new Map(),
    devices: [],
  };
}

export async function startDevice(
  world: World,
  profileId: string,
  account: PrivateKeyAccount,
  options: {
    storage?: E2eeStorage;
    enroll?: boolean;
    extra?: Partial<E2eeEngineOptions>;
    /** No WebSocket hints: the engine must rely on polling. */
    noWake?: boolean;
  } = {}
): Promise<TestDevice> {
  const storage = options.storage ?? createMemoryE2eeStorage();
  const device = { profileId, storage, signCalls: 0 } as TestDevice;
  const engineOptions: E2eeEngineOptions = {
    profileId,
    wallet: account.address,
    origin: "localhost:3001",
    platform: "web",
    signTypedData: async (td) => {
      device.signCalls += 1;
      return account.signTypedData(
        td as Parameters<PrivateKeyAccount["signTypedData"]>[0]
      );
    },
    api: createFakeApiClient(world.ds, profileId),
    resolveProfiles: async (ids) =>
      Object.fromEntries(
        ids.map((id) => [id, { handle: id, pfp: null, wallets: [] }])
      ),
    onWake: (listener) => world.ds.subscribe(profileId, listener),
    now: world.clock.now,
    scheduler: world.scheduler,
    random: () => 0.5,
    storage,
    loadWasm: async () => world.wasm,
    polling: false,
    isBlocked: (other) => world.ds.state["blocks"].has(`${profileId}>${other}`),
    ...options.extra,
  };
  if (options.noWake === true) {
    delete engineOptions.onWake;
  }
  device.options = engineOptions;
  device.engine = await createE2eeEngine(engineOptions);
  if (
    options.enroll !== false &&
    device.engine.getStatus() === "needs-enrollment"
  ) {
    await device.engine.enroll();
  }
  world.devices.push(device);
  return device;
}

export async function addUser(
  world: World,
  profileId: string,
  extra?: Partial<E2eeEngineOptions>,
  flags: { noWake?: boolean } = {}
): Promise<TestUser> {
  const account = privateKeyToAccount(generatePrivateKey());
  world.ds.setWallets(profileId, [account.address]);
  const primary = await startDevice(world, profileId, account, {
    ...(extra ? { extra } : {}),
    ...flags,
  });
  const user: TestUser = { profileId, account, devices: [primary], primary };
  world.users.set(profileId, user);
  return user;
}

export async function addDevice(
  world: World,
  user: TestUser
): Promise<TestDevice> {
  const device = await startDevice(world, user.profileId, user.account);
  user.devices.push(device);
  return device;
}

export function stopDevice(world: World, device: TestDevice): void {
  device.engine.dispose();
  world.devices = world.devices.filter((d) => d !== device);
  for (const user of world.users.values()) {
    user.devices = user.devices.filter((d) => d !== device);
  }
}

export const realSleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const writes = (world: World): number =>
  world.ds.state.requests.filter((r) => r.method !== "GET").length;

/** Syncs every device until no device writes anything and no timer is armed. */
export async function settle(world: World, rounds = 40): Promise<void> {
  for (let round = 0; round < rounds; round += 1) {
    const before = writes(world);
    for (const device of [...world.devices]) {
      if (device.engine.getStatus() === "ready") {
        await device.engine.sync();
      }
    }
    await Promise.all(world.devices.map((device) => device.engine.idle()));
    let waits = 0;
    while (world.scheduler.pending() > 0 && waits < 100) {
      await realSleep(5);
      await Promise.all(world.devices.map((device) => device.engine.idle()));
      waits += 1;
    }
    if (writes(world) === before && world.scheduler.pending() === 0) {
      return;
    }
  }
}

export const texts = (messages: E2eeMessage[]): string[] =>
  messages
    .filter((m) => m.kind === "message" && !m.undecryptable)
    .map((m) => m.text);

export const notices = (messages: E2eeMessage[]): string[] =>
  messages.filter((m) => m.kind === "notice").map((m) => m.notice?.type ?? "");
