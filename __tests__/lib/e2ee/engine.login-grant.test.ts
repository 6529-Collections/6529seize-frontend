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
import { createMemoryE2eeStorage } from "@/lib/e2ee/storage";
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
    deviceKeyHex: mlsKey,
    ciphersuite: E2EE_CIPHERSUITE,
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
  account: PrivateKeyAccount
) {
  const storage = createMemoryE2eeStorage();
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

describe("E2EE engine: combined sign-in grant (NC8)", () => {
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
    await waitForStatus(alice.engine, "ready");
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
  });
});
