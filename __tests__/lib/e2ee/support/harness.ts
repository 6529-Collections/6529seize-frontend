import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  generatePrivateKey,
  privateKeyToAccount,
  type PrivateKeyAccount,
} from "viem/accounts";

import { createE2eeEngine } from "@/lib/e2ee/engine";
import { buildGrant, E2EE_LEGACY_CIPHERSUITE } from "@/lib/e2ee/grant";
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

/**
 * The engine as it ran before D172: the same code on MLS 0x004F, enrolling
 * with a v1 grant (one suite, 0x004F) signed by the wallet. Loaded once in
 * its own module registry with the suite constants swapped, so the current
 * engine is untouched. Its devices, grants, credentials, KeyPackages and
 * conversations are genuine earlier-suite ones, made before any move.
 */
let earlierSuiteEngine: typeof createE2eeEngine | null = null;

function loadEarlierSuiteEngine(): typeof createE2eeEngine {
  if (earlierSuiteEngine) {
    return earlierSuiteEngine;
  }
  const grantModule = "@/lib/e2ee/grant";
  jest.isolateModules(() => {
    jest.doMock(grantModule, () => {
      const actual = jest.requireActual<Record<string, unknown>>(grantModule);
      const build = actual["buildGrant"] as typeof buildGrant;
      return {
        ...actual,
        E2EE_CIPHERSUITE: E2EE_LEGACY_CIPHERSUITE,
        E2EE_GRANT_SUITES: [E2EE_LEGACY_CIPHERSUITE],
        buildGrant: (input: Parameters<typeof buildGrant>[0]) => {
          const {
            version: _version,
            ciphersuites: _ciphersuites,
            ...grant
          } = build(input);
          return { ...grant, ciphersuite: E2EE_LEGACY_CIPHERSUITE };
        },
      };
    });
    earlierSuiteEngine = jest.requireActual<{
      createE2eeEngine: typeof createE2eeEngine;
    }>("@/lib/e2ee/engine").createE2eeEngine;
  });
  // Later requires in the main registry get the real module again.
  jest.dontMock(grantModule);
  if (!earlierSuiteEngine) {
    throw new Error("The earlier-suite engine did not load");
  }
  return earlierSuiteEngine;
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
    /** Runs the engine as before D172 (0x004F, grant v1). */
    earlierSuite?: boolean;
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
  const create =
    options.earlierSuite === true ? loadEarlierSuiteEngine() : createE2eeEngine;
  device.engine = await create(engineOptions);
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
  flags: { noWake?: boolean; earlierSuite?: boolean } = {}
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

/**
 * D172 move: stops a device enrolled on the earlier-suite engine (see
 * startDevice's `earlierSuite`) and starts the current engine on the same
 * storage, as when a browser loads the new build. Its groups lose their
 * suite field, as records written before D172 had none. The engine finds an
 * earlier-suite device and retires it. Returns the restarted device.
 */
export async function moveToCurrentSuite(
  world: World,
  user: TestUser,
  device: TestDevice,
  options: {
    enroll?: boolean;
    /**
     * false: do not wait for the engine to settle first (it never does
     * while every send fails); writes already made are what is moved.
     */
    waitIdle?: boolean;
  } = {}
): Promise<TestDevice> {
  if (options.waitIdle === false) {
    stopDevice(world, device);
    // Let a write that was in flight at the stop land first.
    await realSleep(50);
  } else {
    await device.engine.idle();
    stopDevice(world, device);
  }
  const stored = await device.storage.getDevice(device.profileId);
  if (
    !stored ||
    stored.grant.version !== undefined ||
    stored.grant.ciphersuite !== E2EE_LEGACY_CIPHERSUITE
  ) {
    throw new Error("moveToCurrentSuite: not an earlier-suite device");
  }
  const groups = (await device.storage.listGroups(device.profileId)).map(
    ({ ciphersuite: _suite, ...group }) => group
  );
  await device.storage.writeBatch(device.profileId, {
    expectedVersion: await device.storage.getStateVersion(device.profileId),
    groups,
  });
  const restarted = await startDevice(world, user.profileId, user.account, {
    storage: device.storage,
    enroll: options.enroll ?? false,
  });
  user.devices.push(restarted);
  if (user.primary === device) {
    user.primary = restarted;
  }
  return restarted;
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
