/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM + fake delivery service. The browser's
 * session can switch to another connected account while an engine for the
 * first profile is still running (another tab, or before the provider
 * disposes it). Requests then carry the other profile's credentials and the
 * server answers E2EE_NOT_YOUR_DEVICE for a device that is still valid.
 */
import type { E2eeApiClient } from "@/lib/e2ee/api";
import { createE2eeEngine } from "@/lib/e2ee/engine";
import {
  createFakeApiClient,
  type FakeDeliveryService,
} from "@/tests/support/e2ee/fakeDeliveryService.cjs";
import {
  addUser,
  createWorld,
  settle,
  startDevice,
  texts,
  type World,
} from "./support/harness";

jest.setTimeout(180_000);

/** An API client whose caller follows the browser's active account. */
function sessionApi(ds: FakeDeliveryService, initial: string) {
  const session = { caller: initial };
  const clients = new Map<string, E2eeApiClient>();
  const clientFor = (profileId: string): E2eeApiClient => {
    let client = clients.get(profileId);
    if (!client) {
      client = createFakeApiClient(ds, profileId);
      clients.set(profileId, client);
    }
    return client;
  };
  const api = Object.fromEntries(
    Object.keys(clientFor(initial)).map((key) => [
      key,
      (...args: unknown[]) =>
        (
          clientFor(session.caller) as unknown as Record<
            string,
            (...a: unknown[]) => unknown
          >
        )[key]!(...args),
    ])
  ) as unknown as E2eeApiClient;
  return {
    api,
    switchTo: (profileId: string) => {
      session.caller = profileId;
    },
  };
}

/** Alice (one browser session that can switch accounts) and Bob, in a DM. */
async function aliceWithDm(world: World) {
  const session = sessionApi(world.ds, "alice");
  const alice = await addUser(world, "alice", { api: session.api });
  const bob = await addUser(world, "bob");
  const g = await alice.primary.engine.createConversation({
    profileIds: ["bob"],
    kind: "dm",
  });
  await settle(world);
  await bob.primary.engine.send(g, { text: "before the switch" });
  await settle(world);
  expect(texts(alice.primary.engine.getMessages(g))).toEqual([
    "before the switch",
  ]);
  return { session, alice, bob, g };
}

const welcomesCalls = (world: World, deviceKey: string): number =>
  world.ds.state.requests.filter(
    (request) =>
      request.method === "GET" &&
      request.path === `e2ee/devices/${encodeURIComponent(deviceKey)}/welcomes`
  ).length;

describe("E2EE engine: account switch in the same browser", () => {
  it("a sync with another account's credentials keeps the local state", async () => {
    const world = await createWorld();
    const { session, alice, bob, g } = await aliceWithDm(world);
    const storage = alice.primary.storage;
    const deviceKey = alice.primary.engine.getThisDevice()!.deviceKey;

    session.switchTo("bob");
    await alice.primary.engine.sync();
    await alice.primary.engine.idle();

    expect(alice.primary.engine.getStatus()).toBe("ready");
    expect((await storage.getDevice("alice"))?.deviceKey).toBe(deviceKey);
    expect(await storage.getWasmState("alice")).not.toBeNull();
    expect(await storage.listGroups("alice")).toHaveLength(1);
    expect(await storage.listMessages("alice", g)).not.toHaveLength(0);

    // Back on Alice's account, the same device carries on.
    session.switchTo("alice");
    await bob.primary.engine.send(g, { text: "after the switch" });
    await settle(world);
    expect(texts(alice.primary.engine.getMessages(g))).toEqual([
      "before the switch",
      "after the switch",
    ]);
  });

  it("an engine started under another account's session wipes nothing", async () => {
    const world = await createWorld();
    const { session, alice, g } = await aliceWithDm(world);
    const storage = alice.primary.storage;
    const deviceKey = alice.primary.engine.getThisDevice()!.deviceKey;
    alice.primary.engine.dispose();
    await alice.primary.engine.idle();

    // A reload while the active account is Bob: /e2ee/me answers for Bob.
    session.switchTo("bob");
    const restarted = await createE2eeEngine({
      ...alice.primary.options,
      storage,
    });
    await restarted.idle();

    expect(restarted.getStatus()).toBe("ready");
    expect(restarted.getDevices().map((d) => d.deviceKey)).not.toContain(
      world.ds.devicesOf("bob")[0]!.device_key
    );
    expect((await storage.getDevice("alice"))?.deviceKey).toBe(deviceKey);
    expect(await storage.listMessages("alice", g)).not.toHaveLength(0);
    restarted.dispose();
  });

  it("NOT_YOUR_DEVICE is ignored while /e2ee/me still lists the device as active", async () => {
    const world = await createWorld();
    const { alice, g } = await aliceWithDm(world);
    const storage = alice.primary.storage;
    const api = alice.primary.options.api as unknown as Record<
      string,
      unknown
    >;
    api["getWelcomes"] = () =>
      Promise.reject(
        Object.assign(new Error("not yours"), {
          name: "E2eeApiError",
          status: 403,
          code: "E2EE_NOT_YOUR_DEVICE",
        })
      );

    await alice.primary.engine.sync();
    await alice.primary.engine.idle();

    expect(alice.primary.engine.getStatus()).toBe("ready");
    expect(await storage.getDevice("alice")).not.toBeNull();
    expect(await storage.listMessages("alice", g)).not.toHaveLength(0);
  });

  it("a rejection that lands after dispose wipes nothing", async () => {
    const world = await createWorld();
    const { session, alice, g } = await aliceWithDm(world);
    const storage = alice.primary.storage;
    const api = alice.primary.options.api as unknown as Record<
      string,
      (...args: unknown[]) => Promise<unknown>
    >;
    const getWelcomes = api["getWelcomes"]!;
    let release: () => void = () => undefined;
    const sent = new Promise<void>((resolve) => {
      api["getWelcomes"] = async (...args: unknown[]) => {
        resolve();
        await new Promise<void>((r) => {
          release = r;
        });
        return getWelcomes(...args);
      };
    });

    const sync = alice.primary.engine.sync().catch(() => undefined);
    await sent;
    // The provider disposes the engine; the request in flight then answers
    // for the account the browser switched to.
    session.switchTo("bob");
    alice.primary.engine.dispose();
    release();
    await sync;
    await alice.primary.engine.idle();

    expect(await storage.getDevice("alice")).not.toBeNull();
    expect(await storage.getWasmState("alice")).not.toBeNull();
    expect(await storage.listMessages("alice", g)).not.toHaveLength(0);
  });

  it("a genuine revocation found through polling still wipes the device", async () => {
    const world = await createWorld();
    const { alice, bob } = await aliceWithDm(world);
    const laptop = await startDevice(world, "alice", alice.account, {
      noWake: true,
    });
    await settle(world);
    const laptopKey = laptop.engine.getThisDevice()!.deviceKey;

    await alice.primary.engine.revokeDevice(laptopKey);
    await laptop.engine.sync();
    await laptop.engine.idle();

    expect(laptop.engine.getStatus()).toBe("needs-enrollment");
    expect(await laptop.storage.getDevice("alice")).toBeNull();
    expect(welcomesCalls(world, laptopKey)).toBeGreaterThan(0);
    expect(bob.primary.engine.getStatus()).toBe("ready");
  });
});
