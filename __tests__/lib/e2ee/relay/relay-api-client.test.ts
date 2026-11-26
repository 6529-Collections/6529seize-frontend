/**
 * @jest-environment node
 */
import type { E2eeApiClient } from "@/lib/e2ee/api";
import type { ApiE2eeMe } from "@/lib/e2ee/api-types";
import { fakeRelay, RELAY_VECTORS, streamHead } from "./relay-test-utils";

const mockReadUsableDeviceGrant = jest.fn();
jest.mock("@/lib/device-signing/device-key-store", () => ({
  readUsableDeviceGrant: (...args: unknown[]) =>
    mockReadUsableDeviceGrant(...args),
}));
jest.mock("@/lib/device-signing/ed25519", () => {
  const actual = jest.requireActual("@/lib/device-signing/ed25519");
  return { ...actual, signEventId: async () => `0x${"11".repeat(64)}` };
});

import {
  relaySettingsOf,
  withE2eeRelayReads,
} from "@/lib/e2ee/relay/relay-api-client";

const WALLET = `0x${"aa".repeat(20)}`;
const GRANT = RELAY_VECTORS.orderer_grant;

function me(relay?: Record<string, unknown>): ApiE2eeMe {
  return {
    profile_id: "pa",
    devices: [],
    key_packages: [],
    max_devices: 10,
    ...(relay ? { relay } : {}),
  } as ApiE2eeMe;
}

const PRIMARY = {
  mode: "primary",
  urls: ["wss://relay.test"],
  net: RELAY_VECTORS.net,
  orderer_key: RELAY_VECTORS.orderer_key,
  grant_proofs: [GRANT],
};

let inboxHead: { pos: number; hash: string };
beforeAll(async () => {
  inboxHead = await streamHead(`dv/${RELAY_VECTORS.device}`);
});

function baseClient(relay: Record<string, unknown> | undefined) {
  return {
    getMe: jest.fn().mockResolvedValue(me(relay)),
    getDeviceInboxStatus: jest.fn().mockImplementation(async () => ({
      has_pending_chats: true,
      has_queued_welcomes: true,
      relay_head: inboxHead,
    })),
    getWelcomes: jest.fn().mockResolvedValue([{ id: "from-rest" }]),
    getLog: jest
      .fn()
      .mockResolvedValue({ items: [], next_after_seq: null, group: {} }),
    getGroup: jest
      .fn()
      .mockResolvedValue({ group: RELAY_VECTORS.group, last_seq: 3 }),
    getBlobChunk: jest.fn().mockResolvedValue({ data: "from-rest" }),
    sendMessage: jest.fn(),
  } as unknown as jest.Mocked<E2eeApiClient>;
}

beforeEach(() => {
  mockReadUsableDeviceGrant.mockResolvedValue({
    record: {
      publicKeyHex: GRANT.device_key,
      keyPair: { privateKey: {} },
    },
    grant: { id: GRANT.id },
  });
});

describe("relaySettingsOf", () => {
  it("reads from the relays only in primary mode with a sound block", () => {
    expect(relaySettingsOf(me())).toBeNull();
    expect(relaySettingsOf(me({ ...PRIMARY, mode: "mirror" }))).toBeNull();
    expect(relaySettingsOf(me({ ...PRIMARY, urls: ["https://x"] }))).toBeNull();
    expect(relaySettingsOf(me({ ...PRIMARY, orderer_key: "0x12" }))).toBeNull();
    expect(relaySettingsOf(me(PRIMARY))).toMatchObject({
      urls: ["wss://relay.test"],
      ordererKey: RELAY_VECTORS.orderer_key,
    });
  });
});

describe("withE2eeRelayReads", () => {
  it("reads from 6529.io while the relays are not primary", async () => {
    const base = baseClient({ ...PRIMARY, mode: "mirror" });
    const relay = fakeRelay();
    const client = withE2eeRelayReads(base, {
      wallet: WALLET,
      open: relay.open,
    });
    await client.getMe();
    await expect(client.getWelcomes(RELAY_VECTORS.device)).resolves.toEqual([
      { id: "from-rest" },
    ]);
    expect(relay.requests["HELLO"]).toBeUndefined();
  });

  it("reads Welcomes, log pages and chunks from the relays when primary", async () => {
    const base = baseClient(PRIMARY);
    const relay = fakeRelay();
    const client = withE2eeRelayReads(base, {
      wallet: WALLET,
      open: relay.open,
    });
    await client.getMe();
    const welcomes = await client.getWelcomes(RELAY_VECTORS.device);
    expect(welcomes.map((welcome) => welcome.id)).toEqual([
      `0x${"a2".repeat(16)}`,
    ]);
    const page = await client.getLog(RELAY_VECTORS.group, {
      deviceKey: RELAY_VECTORS.device,
      afterSeq: 0,
    });
    expect(page.items.map((item) => item.seq)).toEqual([1, 2, 3]);
    expect(page.group).toMatchObject({ last_seq: 3 });
    await expect(
      client.getBlobChunk(RELAY_VECTORS.blob, 1, RELAY_VECTORS.device)
    ).resolves.toEqual({ data: Buffer.alloc(1000, 2).toString("base64") });
    expect(base.getWelcomes).not.toHaveBeenCalled();
    expect(base.getLog).not.toHaveBeenCalled();
    expect(base.getBlobChunk).not.toHaveBeenCalled();
  });

  it("falls back to 6529.io for any relay failure, one call at a time", async () => {
    const base = baseClient(PRIMARY);
    const relay = fakeRelay();
    relay.down = true;
    const fallbacks: string[] = [];
    const client = withE2eeRelayReads(base, {
      wallet: WALLET,
      open: relay.open,
      onFallback: (call) => fallbacks.push(call),
    });
    await client.getMe();
    await expect(client.getWelcomes(RELAY_VECTORS.device)).resolves.toEqual([
      { id: "from-rest" },
    ]);
    relay.down = false;
    base.getGroup.mockResolvedValueOnce({ last_seq: 9 } as never);
    await client.getLog(RELAY_VECTORS.group, {
      deviceKey: RELAY_VECTORS.device,
      afterSeq: 0,
    });
    expect(base.getLog).toHaveBeenCalledTimes(1);
    expect(fallbacks).toEqual(["getWelcomes", "getLog"]);
  });

  it("falls back to 6529.io when it names no inbox head", async () => {
    const base = baseClient(PRIMARY);
    base.getDeviceInboxStatus.mockResolvedValue({ has_pending_chats: true });
    const fallbacks: string[] = [];
    const client = withE2eeRelayReads(base, {
      wallet: WALLET,
      open: fakeRelay().open,
      onFallback: (call) => fallbacks.push(call),
    });
    await client.getMe();
    await expect(client.getWelcomes(RELAY_VECTORS.device)).resolves.toEqual([
      { id: "from-rest" },
    ]);
    expect(fallbacks).toEqual(["getWelcomes"]);
  });

  it("falls back without a device grant the relays accept", async () => {
    mockReadUsableDeviceGrant.mockResolvedValue(null);
    const base = baseClient(PRIMARY);
    const client = withE2eeRelayReads(base, {
      wallet: WALLET,
      open: fakeRelay().open,
    });
    await client.getMe();
    await client.getWelcomes(RELAY_VECTORS.device);
    expect(base.getWelcomes).toHaveBeenCalledTimes(1);
  });

  it("follows a rollback within the settings lifetime", async () => {
    let at = 0;
    const base = baseClient(PRIMARY);
    const relay = fakeRelay();
    const client = withE2eeRelayReads(base, {
      wallet: WALLET,
      open: relay.open,
      now: () => at,
    });
    await client.getMe();
    await client.getWelcomes(RELAY_VECTORS.device);
    expect(base.getWelcomes).not.toHaveBeenCalled();
    base.getMe.mockResolvedValue(me({ ...PRIMARY, mode: "mirror" }));
    at = 6 * 60 * 1000;
    await client.getWelcomes(RELAY_VECTORS.device);
    expect(base.getWelcomes).toHaveBeenCalledTimes(1);
  });

  it("sends nothing extra before the engine reads GET e2ee/me", async () => {
    const base = baseClient(PRIMARY);
    const client = withE2eeRelayReads(base, { wallet: WALLET });
    await client.getWelcomes(RELAY_VECTORS.device);
    expect(base.getMe).not.toHaveBeenCalled();
    expect(base.getWelcomes).toHaveBeenCalledTimes(1);
  });

  it("passes writes straight to 6529.io", () => {
    const base = baseClient(PRIMARY);
    const client = withE2eeRelayReads(base, { wallet: WALLET });
    expect(client.sendMessage).toBe(base.sendMessage);
  });
});
