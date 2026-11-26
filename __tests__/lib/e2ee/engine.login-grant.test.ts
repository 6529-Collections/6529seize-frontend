/**
 * @jest-environment node
 *
 * Integration (NC8): a combined sign-in grant enrolls the encrypted-messages
 * device with no second wallet prompt. Real OpenMLS WASM, fake delivery
 * service, memory storage.
 */
import type { PrivateKeyAccount } from "viem/accounts";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  buildDeviceGrantUrn,
  buildMlsDeviceGrantUrn,
  DEFAULT_DEVICE_SCOPES,
  renderCombinedGrantStatement,
} from "@/lib/device-signing/grant-message";
import { E2EE_CIPHERSUITE, grantExpiresAt } from "@/lib/e2ee/grant";
import { createLoginE2eeDevice } from "@/lib/e2ee/login-device";
import type { StoredConversationPins } from "@/lib/e2ee/records";
import { createMemoryE2eeStorage, type E2eeStorage } from "@/lib/e2ee/storage";
import {
  addUser,
  createWorld,
  realSleep,
  settle,
  startDevice,
  texts,
  type World,
} from "./support/harness";

jest.setTimeout(180_000);

const SIGNING_KEY = `0x${"d7".repeat(32)}`;
// Sign-in grants verify only for 6529 domains (as signed drops do).
const ORIGIN = "staging.6529.io";

/** Enrollment from a sign-in grant runs in the background after start. */
async function waitForStatus(
  engine: { getStatus(): string },
  status: string
): Promise<void> {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    if (engine.getStatus() === status) {
      return;
    }
    await realSleep(10);
  }
  throw new Error(`engine stayed ${engine.getStatus()}, expected ${status}`);
}

/** What the backend issues for a combined request, signed by the wallet. */
async function signCombinedSignIn(
  world: World,
  account: PrivateKeyAccount,
  mlsKey: string
): Promise<{ message: string; signature: string }> {
  const issuedAtSeconds = Math.floor(world.clock.now() / 1000);
  const expiresAtSeconds = grantExpiresAt(issuedAtSeconds);
  const signing = {
    deviceKeyHex: SIGNING_KEY,
    scopes: DEFAULT_DEVICE_SCOPES,
    expiresAtSeconds,
  };
  const mls = {
    version: 2 as const,
    deviceKeyHex: mlsKey,
    ciphersuites: [E2EE_CIPHERSUITE],
    expiresAtSeconds,
  };
  const issuedAt = new Date(issuedAtSeconds * 1000).toISOString();
  const message = [
    `https://${ORIGIN} wants you to sign in with your Ethereum account:`,
    account.address,
    "",
    renderCombinedGrantStatement(signing, mls),
    "",
    `URI: https://${ORIGIN}`,
    "Version: 1",
    "Chain ID: 1",
    "Nonce: a1b2c3d4e5f60718293a4b5c6d7e8f90",
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${new Date(issuedAtSeconds * 1000 + 300_000).toISOString()}`,
    "Resources:",
    `- ${buildDeviceGrantUrn(signing)}`,
    `- ${buildMlsDeviceGrantUrn(mls)}`,
  ].join("\n");
  return { message, signature: await account.signMessage({ message }) };
}

/** The sign-in flow: prepare the key, sign once, store, adopt. */
async function combinedSignIn(
  world: World,
  profileId: string,
  account: PrivateKeyAccount,
  storage: E2eeStorage = createMemoryE2eeStorage()
) {
  const prepared = await createLoginE2eeDevice({
    loadWasm: async () => world.wasm,
    storage,
    now: world.clock.now,
  });
  const { message, signature } = await signCombinedSignIn(
    world,
    account,
    prepared.deviceKeyHex
  );
  const grantId = world.ds.storeLoginGrant({
    message,
    signature,
    wallet: account.address,
  });
  const issuedAtSeconds = Math.floor(world.clock.now() / 1000);
  const adopted = await prepared.adopt({
    profileId,
    wallet: account.address,
    grantId,
    walletSignature: signature,
    origin: ORIGIN,
    issuedAtSeconds,
    expiresAtSeconds: grantExpiresAt(issuedAtSeconds),
  });
  return { storage, grantId, deviceKey: prepared.deviceKeyHex, adopted };
}

const REGISTER = /^e2ee\/devices\/login-grant$/;

const registrations = (world: World): number =>
  world.ds.state.requests.filter(
    (r) => r.method === "POST" && REGISTER.test(r.path)
  ).length;

/**
 * Starts `first` (one of them reaches the registration request), holds that
 * request so the engine stays "enrolling", starts `whileHeld`, then releases
 * it. Returns every call, in order.
 */
async function overlapRegistration(
  world: World,
  engine: { getStatus(): string },
  first: () => Promise<unknown>[],
  whileHeld: () => Promise<unknown>[]
): Promise<Promise<unknown>[]> {
  const gate = world.ds.hold(REGISTER);
  const calls: Promise<unknown>[] = [];
  try {
    calls.push(...first());
    await gate.arrived();
    expect(engine.getStatus()).toBe("enrolling");
    calls.push(...whileHeld());
  } finally {
    gate.release();
  }
  return calls;
}

/**
 * The setup page's storage-event resume and the combined turn-on both call
 * enrollWithLoginGrant(): two together, then a third while the held
 * registration keeps the engine "enrolling".
 */
async function concurrentLoginGrantEnrollments(
  world: World,
  engine: { enrollWithLoginGrant(): Promise<string>; getStatus(): string }
): Promise<unknown[]> {
  const calls = await overlapRegistration(
    world,
    engine,
    () => [engine.enrollWithLoginGrant(), engine.enrollWithLoginGrant()],
    () => [engine.enrollWithLoginGrant()]
  );
  return Promise.all(calls);
}

/** Starts an engine waiting for enrollment with a combined sign-in stored. */
async function signedInWaitingEngine() {
  const world = await createWorld();
  const account = privateKeyToAccount(generatePrivateKey());
  world.ds.setWallets("alice", [account.address]);
  const storage = createMemoryE2eeStorage();
  const alice = await startDevice(world, "alice", account, {
    storage,
    enroll: false,
    extra: { origin: ORIGIN },
  });
  const signIn = await combinedSignIn(world, "alice", account, storage);
  return { world, account, storage, alice, signIn };
}

describe("E2EE engine: combined sign-in grant (NC8)", () => {
  it("clears a rejected session on real engine recreation and settles at the device limit", async () => {
    const world = await createWorld();
    const account = privateKeyToAccount(generatePrivateKey());
    world.ds.setWallets("alice", [account.address]);
    const first = await startDevice(world, "alice", account, { enroll: false });
    world.ds.addFault({ method: "POST", path: /^e2ee\/devices$/, status: 401 });
    await expect(first.engine.enroll()).rejects.toThrow();
    expect(first.engine.getError()).toBe("E2EE_SESSION_EXPIRED");
    const saved = await first.storage.getDevice("alice");
    first.engine.dispose();
    for (let count = 0; count < 10; count += 1) {
      const other = await startDevice(world, "alice", account);
      other.engine.dispose();
    }
    // Provider restart disposes the old engine and recreates it with the
    // same storage. The API now accepts the session; its real device cap
    // is the remaining refusal, without manually clearing engine errors.
    const restarted = await startDevice(world, "alice", account, {
      storage: first.storage,
      enroll: false,
    });
    expect(restarted.engine.getError()).toBeNull();
    await expect(
      restarted.engine.enrollWithLoginGrant({ resumeStored: true })
    ).resolves.toBe("device-limit");
    expect(restarted.engine.getError()).toBeNull();
    expect(restarted.engine.getDevices()).toHaveLength(10);
    expect((await first.storage.getDevice("alice"))?.deviceKey).toBe(
      saved?.deviceKey
    );
    await expect(
      restarted.engine.enrollWithLoginGrant({ resumeStored: true })
    ).resolves.toBe("device-limit");
    expect(restarted.engine.getError()).toBeNull();
    expect(restarted.signCalls).toBe(0);
    for (const device of world.devices) device.engine.dispose();
  });

  it.each([false, true])(
    "resumes an existing typed-data grant without a wallet prompt (renewal due: %s)",
    async (renewal) => {
      const world = await createWorld();
      const account = privateKeyToAccount(generatePrivateKey());
      world.ds.setWallets("alice", [account.address]);
      const first = await startDevice(world, "alice", account, {
        enroll: false,
      });
      world.ds.addFault({
        method: "POST",
        path: /^e2ee\/devices$/,
        status: 401,
      });
      await expect(first.engine.enroll()).rejects.toThrow();
      expect(first.engine.getError()).toBe("E2EE_SESSION_EXPIRED");
      const saved = await first.storage.getDevice("alice");
      expect(saved?.registered).toBe(false);
      first.engine.dispose();
      if (renewal) world.clock.advance(170 * 86_400_000);
      const resumed = await startDevice(world, "alice", account, {
        storage: first.storage,
        enroll: false,
      });
      await expect(
        resumed.engine.enrollWithLoginGrant({ resumeStored: true })
      ).resolves.toBe(renewal ? "needs-enrollment" : "ready");
      expect(resumed.signCalls).toBe(0);
      expect((await first.storage.getDevice("alice"))?.deviceKey).toBe(
        saved?.deviceKey
      );
      expect(world.ds.devicesOf("alice")).toHaveLength(renewal ? 0 : 1);
      for (const device of world.devices) device.engine.dispose();
    }
  );

  it("still renews an enrolled device with wallet approval through the separate action", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const key = alice.primary.engine.getLocalDeviceKey();
    const before = alice.primary.signCalls;
    world.clock.advance(170 * 86_400_000);
    await alice.primary.engine.enroll();
    expect(alice.primary.engine.getStatus()).toBe("ready");
    expect(alice.primary.signCalls).toBe(before + 1);
    expect(alice.primary.engine.getLocalDeviceKey()).toBe(key);
    for (const device of world.devices) device.engine.dispose();
  });

  it("enrolls from the sign-in grant with no wallet prompt and chats with an EIP-712 device", async () => {
    const world = await createWorld();
    const bob = await addUser(world, "bob");
    const account = privateKeyToAccount(generatePrivateKey());
    world.ds.setWallets("alice", [account.address]);
    const signIn = await combinedSignIn(world, "alice", account);
    expect(signIn.adopted).toBe(true);

    const alice = await startDevice(world, "alice", account, {
      storage: signIn.storage,
      enroll: false,
      extra: { origin: ORIGIN, deviceLabel: "Chrome on Windows" },
    });

    // Engine start does not wait for the network: it reports "enrolling".
    expect(alice.engine.getStatus()).not.toBe("needs-enrollment");
    // Combined setup can ask for the result while the background attempt is
    // still running. Both callers should see the final status.
    await expect(
      Promise.all([
        alice.engine.enrollWithLoginGrant(),
        alice.engine.enrollWithLoginGrant(),
      ])
    ).resolves.toEqual(["ready", "ready"]);
    expect(alice.signCalls).toBe(0);
    const [record] = world.ds.devicesOf("alice");
    expect(record).toMatchObject({
      device_key: signIn.deviceKey,
      grant_id: signIn.grantId,
      // Named like a device enrolled with the grant prompt.
      label: "Chrome on Windows",
    });
    expect(typeof record.grant_message).toBe("string");

    const g = await alice.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    await alice.engine.send(g, { text: "one signature at sign-in" });
    await settle(world);
    // Bob's engine verified Alice's sign-in grant before accepting her leaf.
    expect(bob.primary.engine.getConversation(g)).toMatchObject({
      status: "active",
    });
    expect(texts(bob.primary.engine.getMessages(g))).toContain(
      "one signature at sign-in"
    );
    await bob.primary.engine.send(g, { text: "and back" });
    await settle(world);
    expect(texts(alice.engine.getMessages(g))).toContain("and back");
  });

  it("falls back to the separate prompt when the server refuses the sign-in grant", async () => {
    const world = await createWorld();
    const account = privateKeyToAccount(generatePrivateKey());
    world.ds.setWallets("alice", [account.address]);
    const signIn = await combinedSignIn(world, "alice", account);
    world.ds.revokeLoginGrant(signIn.grantId);

    const alice = await startDevice(world, "alice", account, {
      storage: signIn.storage,
      enroll: false,
      extra: { origin: ORIGIN },
    });
    // No prompt on its own: the rejected key is dropped, enrollment waits.
    await waitForStatus(alice.engine, "needs-enrollment");
    await settle(world);
    expect(alice.signCalls).toBe(0);
    expect(world.ds.devicesOf("alice")).toEqual([]);
    expect(await signIn.storage.getDevice("alice")).toBeNull();

    await alice.engine.enroll();
    expect(alice.engine.getStatus()).toBe("ready");
    expect(alice.signCalls).toBe(1);
    const [record] = world.ds.devicesOf("alice");
    expect(record.device_key).not.toBe(signIn.deviceKey);
    expect(record.grant_message ?? null).toBeNull();
  });

  it("keeps the trust pins when the server refuses the sign-in grant", async () => {
    const world = await createWorld();
    const account = privateKeyToAccount(generatePrivateKey());
    world.ds.setWallets("alice", [account.address]);
    const signIn = await combinedSignIn(world, "alice", account);
    // Pins handed on from an earlier device on this browser (D172).
    const trust = {
      wallets: { bob: [`0x${"bb".repeat(20)}`] },
      approved: [],
      ignored: [],
    };
    const pending = (await signIn.storage.getDevice("alice"))!;
    await signIn.storage.writeBatch("alice", {
      device: { ...pending, trust },
    });
    world.ds.revokeLoginGrant(signIn.grantId);

    const alice = await startDevice(world, "alice", account, {
      storage: signIn.storage,
      enroll: false,
      extra: { origin: ORIGIN },
    });
    await waitForStatus(alice.engine, "needs-enrollment");
    await settle(world);
    // The refused key goes; the pins stay with a retired marker.
    expect(await signIn.storage.getDevice("alice")).toMatchObject({
      deviceKey: signIn.deviceKey,
      retired: true,
      registered: false,
      trust,
    });
    expect(await signIn.storage.getWasmState("alice")).toBeNull();

    await alice.engine.enroll();
    expect(alice.engine.getStatus()).toBe("ready");
    const fresh = (await signIn.storage.getDevice("alice"))!;
    expect(fresh.deviceKey).not.toBe(signIn.deviceKey);
    expect(fresh.trust?.wallets).toEqual(trust.wallets);
  });

  it("keeps conversation pins when a sign-in replaces a pending device", async () => {
    const world = await createWorld();
    const account = privateKeyToAccount(generatePrivateKey());
    world.ds.setWallets("alice", [account.address]);
    const first = await combinedSignIn(world, "alice", account);
    const pending = (await first.storage.getDevice("alice"))!;
    expect(pending.registered).toBe(false);
    const thread = "dm:bob";
    const conversationPins: StoredConversationPins = {
      versions: { [thread]: [thread, 1, "a".repeat(32), true] },
      unsent: [thread],
    };
    await first.storage.writeBatch("alice", {
      device: { ...pending, conversationPins },
    });

    const second = await combinedSignIn(world, "alice", account, first.storage);

    expect(second.adopted).toBe(true);
    expect(second.deviceKey).not.toBe(first.deviceKey);
    expect(await second.storage.getDevice("alice")).toMatchObject({
      deviceKey: second.deviceKey,
      conversationPins,
    });
  });

  it("keeps an enrolled device when a later sign-in grants a new key", async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const enrolledKey = world.ds.devicesOf("alice")[0].device_key;
    const prepared = await createLoginE2eeDevice({
      loadWasm: async () => world.wasm,
      storage: alice.primary.storage,
    });
    const adopted = await prepared.adopt({
      profileId: "alice",
      wallet: alice.account.address,
      grantId: `0x${"1".repeat(64)}`,
      walletSignature: "0x",
      origin: "localhost:3001",
      issuedAtSeconds: 1,
      expiresAtSeconds: 60,
    });
    expect(adopted).toBe(false);
    expect((await alice.primary.storage.getDevice("alice"))?.deviceKey).toBe(
      enrolledKey
    );
    // Turning on again would only resume this device: no new grant needed.
    expect(await alice.primary.engine.needsNewDevice()).toBe(false);
  });

  it("enrolls a running engine from a combined sign-in made while it waited", async () => {
    const world = await createWorld();
    const account = privateKeyToAccount(generatePrivateKey());
    world.ds.setWallets("alice", [account.address]);
    const storage = createMemoryE2eeStorage();
    const onStateConflict = jest.fn();
    const alice = await startDevice(world, "alice", account, {
      storage,
      enroll: false,
      extra: {
        origin: ORIGIN,
        deviceLabel: "Chrome on Windows",
        onStateConflict,
      },
    });
    expect(alice.engine.getStatus()).toBe("needs-enrollment");
    expect(await alice.engine.needsNewDevice()).toBe(true);
    // Nothing to register yet: no prompt and no change.
    await expect(alice.engine.enrollWithLoginGrant()).resolves.toBe(
      "needs-enrollment"
    );

    // The gate's sign-in stores the key while this engine holds the lock.
    const signIn = await combinedSignIn(world, "alice", account, storage);
    expect(signIn.adopted).toBe(true);
    expect(await alice.engine.needsNewDevice()).toBe(false);

    await expect(alice.engine.enrollWithLoginGrant()).resolves.toBe("ready");
    expect(alice.signCalls).toBe(0);
    expect(onStateConflict).not.toHaveBeenCalled();
    const [record] = world.ds.devicesOf("alice");
    expect(record).toMatchObject({
      device_key: signIn.deviceKey,
      grant_id: signIn.grantId,
      label: "Chrome on Windows",
    });
    expect((await storage.getDevice("alice"))?.registered).toBe(true);
    // Already enrolled: a repeat call changes nothing.
    await expect(alice.engine.enrollWithLoginGrant()).resolves.toBe("ready");
    expect(world.ds.devicesOf("alice")).toHaveLength(1);
  });

  it("leaves a running engine waiting for the grant prompt when the sign-in grant is refused", async () => {
    const world = await createWorld();
    const account = privateKeyToAccount(generatePrivateKey());
    world.ds.setWallets("alice", [account.address]);
    const storage = createMemoryE2eeStorage();
    const alice = await startDevice(world, "alice", account, {
      storage,
      enroll: false,
      extra: { origin: ORIGIN },
    });
    const signIn = await combinedSignIn(world, "alice", account, storage);
    world.ds.revokeLoginGrant(signIn.grantId);

    await expect(alice.engine.enrollWithLoginGrant()).resolves.toBe(
      "needs-enrollment"
    );
    expect(alice.engine.getError()).toBe("E2EE_LOGIN_GRANT_REJECTED");
    expect(alice.signCalls).toBe(0);
    expect(await storage.getDevice("alice")).toBeNull();
    expect(await alice.engine.needsNewDevice()).toBe(true);

    await alice.engine.enroll();
    expect(alice.engine.getStatus()).toBe("ready");
    expect(alice.signCalls).toBe(1);
  });

  it("gives concurrent sign-in enrollments one registration and its final status", async () => {
    const { world, alice, signIn } = await signedInWaitingEngine();

    await expect(
      concurrentLoginGrantEnrollments(world, alice.engine)
    ).resolves.toEqual(["ready", "ready", "ready"]);
    expect(registrations(world)).toBe(1);
    expect(world.ds.devicesOf("alice")).toEqual([
      expect.objectContaining({ device_key: signIn.deviceKey }),
    ]);
    expect(alice.signCalls).toBe(0);
  });

  it("gives concurrent callers needs-enrollment for a refused sign-in grant, then enrolls later", async () => {
    const { world, account, storage, alice, signIn } =
      await signedInWaitingEngine();
    world.ds.revokeLoginGrant(signIn.grantId);

    await expect(
      concurrentLoginGrantEnrollments(world, alice.engine)
    ).resolves.toEqual([
      "needs-enrollment",
      "needs-enrollment",
      "needs-enrollment",
    ]);
    expect(registrations(world)).toBe(1);
    expect(alice.engine.getError()).toBe("E2EE_LOGIN_GRANT_REJECTED");
    expect(world.ds.devicesOf("alice")).toEqual([]);

    // The next combined sign-in enrolls: nothing is left in flight.
    const next = await combinedSignIn(world, "alice", account, storage);
    await expect(alice.engine.enrollWithLoginGrant()).resolves.toBe("ready");
    expect(registrations(world)).toBe(2);
    expect(world.ds.devicesOf("alice")).toEqual([
      expect.objectContaining({ device_key: next.deviceKey }),
    ]);
    expect(alice.signCalls).toBe(0);
  });

  it("reports provisioning after the fallback wallet signature", async () => {
    const { world, alice, signIn } = await signedInWaitingEngine();
    world.ds.revokeLoginGrant(signIn.grantId);
    const onProvisioning = jest.fn();

    await alice.engine.enroll(() => onProvisioning(alice.signCalls));

    expect(onProvisioning.mock.calls).toEqual([[1]]);
    expect(alice.engine.getStatus()).toBe("ready");
  });

  it("shares one registration between a sign-in enrollment and an explicit enroll()", async () => {
    const { world, alice, signIn } = await signedInWaitingEngine();
    const engine = alice.engine;

    const calls = await overlapRegistration(
      world,
      engine,
      () => [engine.enrollWithLoginGrant()],
      () => [engine.enroll()]
    );
    await expect(Promise.all(calls)).resolves.toEqual(["ready", undefined]);
    expect(engine.getStatus()).toBe("ready");
    expect(registrations(world)).toBe(1);
    expect(world.ds.devicesOf("alice")).toEqual([
      expect.objectContaining({ device_key: signIn.deviceKey }),
    ]);
    // The prompt path joined the run: no wallet prompt, no second device.
    expect(alice.signCalls).toBe(0);
  });

  it("fails only the starting caller on a transient registration error and frees the run", async () => {
    const { world, storage, alice, signIn } = await signedInWaitingEngine();
    const engine = alice.engine;
    world.ds.addFault({ method: "POST", path: REGISTER, status: 503 });

    const [starter, ...joiners] = await overlapRegistration(
      world,
      engine,
      () => [engine.enroll()],
      () => [engine.enrollWithLoginGrant(), engine.enroll()]
    );
    await expect(starter).rejects.toThrow();
    // Joiners settle with the outcome instead of hanging or rethrowing.
    await expect(Promise.all(joiners)).resolves.toEqual(["error", undefined]);
    expect(engine.getStatus()).toBe("error");
    expect(registrations(world)).toBe(1);
    // Nothing partial: no server device, the local key still unregistered.
    expect(world.ds.devicesOf("alice")).toEqual([]);
    expect(await storage.getDevice("alice")).toMatchObject({
      deviceKey: signIn.deviceKey,
      registered: false,
    });

    // The run is free again: a retry registers the same key without a prompt.
    await engine.enroll();
    expect(engine.getStatus()).toBe("ready");
    expect(registrations(world)).toBe(2);
    expect(world.ds.devicesOf("alice")).toEqual([
      expect.objectContaining({ device_key: signIn.deviceKey }),
    ]);
    expect(alice.signCalls).toBe(0);
  });
});
