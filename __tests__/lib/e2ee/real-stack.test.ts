/**
 * @jest-environment node
 */
/*
 * Opt-in: the engine and the real OpenMLS WASM against a running 6529 backend
 * (never staging or production; a local API with a test JWT secret). Skipped
 * unless all of these are set:
 *   E2EE_REAL_STACK_API         e.g. http://localhost:3000/api
 *   E2EE_REAL_STACK_JWT_SECRET  the local API's JWT_SECRET (a test value)
 *   E2EE_REAL_STACK_USERS       JSON [{"profileId": "...", "privateKey": "0x..."}] x4,
 *                               wallets already linked to those profiles
 * Optional: E2EE_REAL_STACK_WS (e.g. ws://localhost:3000) to receive the API's
 * WebSocket hints, as browsers do; E2EE_REAL_STACK_LARGE=1 with at least 90
 * users adds 15- and 87-person groups.
 * Each user's access token is minted locally for its wallet, the way the API's
 * issueAccessToken does (HS256, sub = lowercase wallet).
 */
import { createHmac, randomUUID } from "node:crypto";

import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";

import { E2eeApiError, type E2eeApiClient } from "@/lib/e2ee/api";
import { createE2eeEngine } from "@/lib/e2ee/engine";
import { createMemoryE2eeStorage } from "@/lib/e2ee/storage";
import type { E2eeEngineExt, E2eeMessage } from "@/lib/e2ee/types";
import type { ApiE2eeReport } from "@/generated/models/ApiE2eeReport";

import { loadTestWasm } from "./support/harness";

const API = process.env["E2EE_REAL_STACK_API"] ?? "";
const SECRET = process.env["E2EE_REAL_STACK_JWT_SECRET"] ?? "";
const USERS_JSON = process.env["E2EE_REAL_STACK_USERS"] ?? "";
const WS = process.env["E2EE_REAL_STACK_WS"] ?? "";
const enabled = API !== "" && SECRET !== "" && USERS_JSON !== "";
const describeStack = enabled ? describe : describe.skip;

jest.setTimeout(900_000);

/** Every report response the API returned, as the engine does not expose it. */
const reportResults: ApiE2eeReport[] = [];

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64url");

function mintToken(wallet: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      id: randomUUID(),
      sub: wallet.toLowerCase(),
      iat: now,
      exp: now + 3600,
    })
  );
  const signature = createHmac("sha256", SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

/** Plain fetch client with the same paths and error shape as api.ts. */
function httpClient(token: string): E2eeApiClient {
  const enc = encodeURIComponent;
  const request = async <T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string>
  ): Promise<T> => {
    const url = new URL(`${API}/${path}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, value);
    }
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    const parsed = text === "" ? {} : (JSON.parse(text) as unknown);
    if (!response.ok) {
      const error = parsed as {
        error?: string;
        code?: string;
        current_epoch?: number;
      };
      throw new E2eeApiError({
        message: error.error ?? `HTTP ${response.status}`,
        status: response.status,
        code: error.code ?? null,
        currentEpoch: error.current_epoch ?? null,
      });
    }
    return parsed as T;
  };
  const get = <T>(path: string, query?: Record<string, string>) =>
    request<T>("GET", path, undefined, query);
  const post = <T>(path: string, body: unknown) =>
    request<T>("POST", path, body);
  return {
    getMe: () => get("e2ee/me"),
    registerDevice: (body) => post("e2ee/devices", body),
    registerLoginGrantDevice: (body) => post("e2ee/devices/login-grant", body),
    getDevice: (key) => get(`e2ee/devices/${enc(key)}`),
    getProfileDevices: (id) => get(`e2ee/profiles/${enc(id)}/devices`),
    revokeDevice: (key, body) => post(`e2ee/devices/${enc(key)}/revoke`, body),
    uploadKeyPackages: (key, body) =>
      post(`e2ee/devices/${enc(key)}/key-packages`, body),
    claimKeyPackages: (body) => post("e2ee/key-packages/claim", body),
    checkEligibility: (body) => post("e2ee/eligibility", body),
    createGroup: (body) => post("e2ee/groups", body),
    getGroup: (g, key) => get(`e2ee/groups/${enc(g)}`, { device_key: key }),
    submitEntry: (g, body) => post(`e2ee/groups/${enc(g)}/entries`, body),
    getLog: (g, q) =>
      get(`e2ee/groups/${enc(g)}/log`, {
        device_key: q.deviceKey,
        after_seq: String(q.afterSeq),
        limit: String(q.limit ?? 100),
      }),
    sendMessage: (g, body) => post(`e2ee/groups/${enc(g)}/messages`, body),
    repairRoster: (g, body) => post(`e2ee/groups/${enc(g)}/roster`, body),
    getWelcomes: (key) => get(`e2ee/devices/${enc(key)}/welcomes`),
    ackWelcome: async (key, id) => {
      await post(`e2ee/devices/${enc(key)}/welcomes/${enc(id)}/ack`, {});
    },
    getDeviceGroups: (key) => get(`e2ee/devices/${enc(key)}/groups`),
    createBlob: (body) => post("e2ee/blobs", body),
    putBlobChunk: (id, index, body) =>
      request("PUT", `e2ee/blobs/${enc(id)}/chunks/${index}`, body),
    completeBlob: (id) => post(`e2ee/blobs/${enc(id)}/complete`, {}),
    getBlobChunk: (id, index, key) =>
      get(`e2ee/blobs/${enc(id)}/chunks/${index}`, { device_key: key }),
    report: async (body) => {
      const result = await post<ApiE2eeReport>("e2ee/reports", body);
      reportResults.push(result);
      return result;
    },
  };
}

interface StackUser {
  profileId: string;
  account: PrivateKeyAccount;
  token: string;
}

interface StackDevice {
  user: StackUser;
  engine: E2eeEngineExt;
  signCalls: number;
}

const users: StackUser[] = enabled
  ? (
      JSON.parse(USERS_JSON) as {
        profileId: string;
        privateKey: `0x${string}`;
      }[]
    ).map(({ profileId, privateKey }) => {
      const account = privateKeyToAccount(privateKey);
      return { profileId, account, token: mintToken(account.address) };
    })
  : [];

/** The first `count` stack users; fails the test when fewer are configured. */
function takeUsers(count: number): StackUser[] {
  expect(users.length).toBeGreaterThanOrEqual(count);
  return users.slice(0, count);
}

function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`missing item ${index}`);
  }
  return item;
}

const devices: StackDevice[] = [];
const sockets: WebSocket[] = [];

const authenticatedSockets = new Set<WebSocket>();

/**
 * WebSocket hints from the API, authenticated with the web client's
 * AUTHENTICATE message. The local API attaches its message handler only
 * after it has registered the connection and then sends a `$connect` frame
 * (API Gateway orders this itself), so authenticate on that frame rather
 * than on `open`, or the message can arrive before the handler exists.
 */
function wsWake(
  token: string
): (listener: (event: { type: string; data: unknown }) => void) => () => void {
  return (listener) => {
    const socket = new WebSocket(WS);
    sockets.push(socket);
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as {
        type?: string;
        data?: unknown;
        routeKey?: string;
      };
      if (message.routeKey === "$connect") {
        socket.send(
          JSON.stringify({ type: "AUTHENTICATE", access_token: token })
        );
        return;
      }
      if (message.type === "AUTHENTICATED") {
        authenticatedSockets.add(socket);
      }
      if (typeof message.type === "string") {
        if (process.env["E2EE_REAL_STACK_DEBUG"] === "1") {
          process.stderr.write(`[ws ${token.slice(-6)}] ${message.type}
`);
        }
        listener({ type: message.type, data: message.data });
      }
    });
    return () => socket.close();
  };
}

async function startDevice(user: StackUser): Promise<StackDevice> {
  const wasm = await loadTestWasm();
  const device = { user, signCalls: 0 } as StackDevice;
  device.engine = await createE2eeEngine({
    profileId: user.profileId,
    wallet: user.account.address,
    origin: "localhost:3001",
    platform: "web",
    signTypedData: async (td) => {
      device.signCalls += 1;
      return user.account.signTypedData(
        td as Parameters<PrivateKeyAccount["signTypedData"]>[0]
      );
    },
    api: httpClient(user.token),
    resolveProfiles: async (ids) =>
      Object.fromEntries(
        ids.map((id) => [id, { handle: id, pfp: null, wallets: [] }])
      ),
    storage: createMemoryE2eeStorage(),
    loadWasm: async () => wasm,
    random: () => 0,
    polling: false,
    ...(WS === "" ? {} : { onWake: wsWake(user.token) }),
  });
  if (device.engine.getStatus() === "needs-enrollment") {
    await device.engine.enroll();
  }
  devices.push(device);
  return device;
}

async function settle(rounds = 6): Promise<void> {
  for (let round = 0; round < rounds; round += 1) {
    for (const device of devices) {
      if (device.engine.getStatus() === "ready") {
        await device.engine.sync();
      }
    }
    await Promise.all(devices.map((device) => device.engine.idle()));
  }
}

const texts = (messages: E2eeMessage[]): string[] =>
  messages
    .filter((m) => m.kind === "message" && !m.undecryptable && !m.deleted)
    .map((m) => m.text);

async function setDmPolicy(user: StackUser, policy: string): Promise<void> {
  const response = await fetch(`${API}/profile-preferences`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${user.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ direct_message_policy: policy }),
  });
  expect(response.ok).toBe(true);
}

async function rawLogBytes(device: StackDevice, g: string): Promise<string> {
  const deviceKey = device.engine.getThisDevice()?.deviceKey ?? "";
  const page = await httpClient(device.user.token).getLog(g, {
    deviceKey,
    afterSeq: 0,
    limit: 200,
  });
  return page.items
    .map((item) => Buffer.from(item.data, "base64").toString("latin1"))
    .join("");
}

describeStack("E2EE engine against a real backend", () => {
  afterAll(() => {
    for (const device of devices) {
      device.engine.dispose();
    }
    for (const socket of sockets) {
      socket.close();
    }
  });

  it("enrolls, runs a DM and a group, and keeps removed and new members out", async () => {
    const [alice, bob, carol, dave] = takeUsers(4) as [
      StackUser,
      StackUser,
      StackUser,
      StackUser,
    ];
    const a = await startDevice(alice);
    const b = await startDevice(bob);
    const c = await startDevice(carol);
    const d = await startDevice(dave);
    for (const device of [a, b, c, d]) {
      expect(device.engine.getStatus()).toBe("ready");
      expect(device.signCalls).toBe(1);
    }
    if (WS !== "") {
      // Hints must reach every device, as they do in browsers.
      for (
        let i = 0;
        i < 50 && authenticatedSockets.size < sockets.length;
        i++
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      expect(authenticatedSockets.size).toBe(sockets.length);
    }

    // Story 1: DM with send, edit, react, delete.
    const dm = await a.engine.createConversation({
      profileIds: [bob.profileId],
      kind: "dm",
    });
    await a.engine.send(dm, { text: "hello bob, real stack" });
    await settle();
    expect(texts(b.engine.getMessages(dm))).toContain("hello bob, real stack");
    await b.engine.send(dm, { text: "hi alice" });
    await settle();
    const bobMsg = a.engine.getMessages(dm).find((m) => m.text === "hi alice");
    expect(bobMsg).toBeDefined();
    await a.engine.react(dm, bobMsg!.id, ":fire:", true);
    const own = a.engine
      .getMessages(dm)
      .find((m) => m.text === "hello bob, real stack");
    await a.engine.edit(dm, own!.id, "hello bob, edited");
    await settle();
    expect(texts(b.engine.getMessages(dm))).toContain("hello bob, edited");
    expect(
      a.engine.getMessages(dm).find((m) => m.id === bobMsg!.id)?.reactions[
        ":fire:"
      ]
    ).toEqual([alice.profileId]);
    expect(
      b.engine.getMessages(dm).find((m) => m.id === bobMsg!.id)?.reactions[
        ":fire:"
      ]
    ).toEqual([alice.profileId]);
    await b.engine.remove(dm, bobMsg!.id);
    await settle();
    expect(texts(a.engine.getMessages(dm))).not.toContain("hi alice");

    // The server only ever saw ciphertext.
    const stored = await rawLogBytes(a, dm);
    expect(stored).not.toContain("hello bob");
    expect(stored).not.toContain("hi alice");

    // Story 2/3: group, rename, add, remove, forward and backward secrecy.
    const group = await a.engine.createConversation({
      profileIds: [bob.profileId, carol.profileId],
      kind: "group",
      name: "real stack group",
    });
    await a.engine.send(group, { text: "before dave" });
    await settle();
    expect(texts(c.engine.getMessages(group))).toContain("before dave");
    await a.engine.rename(group, "renamed group");
    await a.engine.addMembers(group, [dave.profileId]);
    await settle();
    expect(d.engine.getConversation(group)?.name).toBe("renamed group");
    expect(texts(d.engine.getMessages(group))).not.toContain("before dave");
    await a.engine.removeMember(group, carol.profileId);
    await settle();
    await b.engine.send(group, { text: "after carol left" });
    await settle();
    expect(texts(d.engine.getMessages(group))).toContain("after carol left");
    expect(texts(c.engine.getMessages(group))).not.toContain(
      "after carol left"
    );
    expect(c.engine.getConversation(group)?.status).toBe("removed");

    // Leaving: bob leaves; later messages don't reach him.
    await b.engine.leave(group);
    await settle();
    await d.engine.send(group, { text: "after bob left" });
    await settle();
    expect(texts(a.engine.getMessages(group))).toContain("after bob left");
    expect(texts(b.engine.getMessages(group))).not.toContain("after bob left");

    // Same epoch fingerprint for the remaining members.
    expect(a.engine.getConversation(group)?.safetyCode).toBe(
      d.engine.getConversation(group)?.safetyCode
    );
  });

  it("adds a second device automatically and revokes it from the first", async () => {
    const alice = at(takeUsers(2), 0);
    const bob = at(users, 1);
    const a = devices.find((d) => d.user === alice)!;
    const b1 = devices.find((d) => d.user === bob)!;
    const dm = a.engine.findDm(bob.profileId)!;
    const b2 = await startDevice(bob);
    expect(b2.signCalls).toBe(1);
    // Bob's first device hears E2EE_DEVICE_ADDED and adds the new device.
    for (let i = 0; i < 30 && b2.engine.getConversation(dm) === null; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await settle(1);
    }
    expect(b2.engine.getConversation(dm)).not.toBeNull();
    await a.engine.send(dm, { text: "to both of bob's devices" });
    await settle();
    expect(texts(b1.engine.getMessages(dm))).toContain(
      "to both of bob's devices"
    );
    expect(texts(b2.engine.getMessages(dm))).toContain(
      "to both of bob's devices"
    );
    const b2Key = b2.engine.getThisDevice()!.deviceKey;
    await b1.engine.revokeDevice(b2Key);
    await settle(10);
    await a.engine.send(dm, { text: "after the revocation" });
    await settle();
    expect(texts(b1.engine.getMessages(dm))).toContain("after the revocation");
    expect(texts(b2.engine.getMessages(dm))).not.toContain(
      "after the revocation"
    );
  });

  it("carries an encrypted attachment and a verifiable report through the API", async () => {
    const alice = at(takeUsers(2), 0);
    const bob = at(users, 1);
    const a = devices.find((d) => d.user === alice)!;
    const b = devices.find(
      (d) => d.user === bob && d.engine.getStatus() === "ready"
    )!;
    const dm = a.engine.findDm(bob.profileId)!;
    // Two 1 MiB chunks; the bytes are a pattern a server copy would show.
    const bytes = new Uint8Array(1_500_000).map((_, i) => i % 251);
    const file = new File([bytes], "photo.png", { type: "image/png" });
    await a.engine.send(dm, { text: "see attached", files: [file] });
    await settle();
    const message = b.engine
      .getMessages(dm)
      .find((m) => m.kind === "message" && m.text === "see attached");
    expect(message?.attachments).toEqual([
      {
        blob: expect.stringMatching(/^0x[0-9a-f]{32}$/),
        mime: "image/png",
        size: bytes.length,
        name: "photo.png",
      },
    ]);
    const blobId = at(message!.attachments, 0).blob;
    const received = await b.engine.getAttachment(dm, message!.id, blobId);
    // Byte-exact, compared with memcmp: a deep toEqual over 1.5 M elements
    // takes seconds, long enough for the local server to drop the idle
    // keep-alive socket the next request reuses (ECONNRESET).
    const receivedBytes = Buffer.from(await received.arrayBuffer());
    expect(receivedBytes.length).toBe(bytes.length);
    expect(receivedBytes.equals(Buffer.from(bytes))).toBe(true);

    // The API holds ciphertext only.
    const chunk = await httpClient(bob.token).getBlobChunk(
      blobId,
      0,
      b.engine.getThisDevice()!.deviceKey
    );
    const stored = Buffer.from(chunk.data, "base64");
    expect(stored.subarray(0, 4096)).not.toEqual(
      Buffer.from(bytes.subarray(0, 4096))
    );

    // Bob reports Alice's message; the API verifies her device signature.
    reportResults.length = 0;
    await b.engine.report(
      dm,
      message!.id,
      "CREDIBLE_THREAT_OF_VIOLENCE",
      "real-stack check"
    );
    expect(reportResults).toEqual([
      expect.objectContaining({
        verified: true,
        sender_profile_id: alice.profileId,
      }),
    ]);
  });

  it("respects the recipient's DM policy", async () => {
    const alice = at(takeUsers(3), 0);
    const carol = at(users, 2);
    const a = devices.find((d) => d.user === alice)!;
    await setDmPolicy(carol, "NOBODY");
    try {
      const results = await a.engine.checkEligibility([carol.profileId]);
      expect(at(results, 0).status).toBe("POLICY");
      await expect(
        a.engine.createConversation({
          profileIds: [carol.profileId],
          kind: "dm",
        })
      ).rejects.toBeDefined();
    } finally {
      await setDmPolicy(carol, "EVERYONE");
    }
  });

  const itLarge =
    process.env["E2EE_REAL_STACK_LARGE"] === "1" && users.length >= 90
      ? it
      : it.skip;

  itLarge("runs 15- and 87-person groups", async () => {
    const alice = at(users, 0);
    const a = devices.find((d) => d.user === alice)!;
    const members: StackDevice[] = [];
    for (const user of users.slice(4, 90)) {
      members.push(await startDevice(user));
    }
    for (const size of [15, 87]) {
      const others = members.slice(0, size - 1);
      const started = Date.now();
      const g = await a.engine.createConversation({
        profileIds: others.map((d) => d.user.profileId),
        kind: "group",
        name: `group of ${size}`,
      });
      const created = Date.now() - started;
      await a.engine.send(g, { text: `hello ${size}` });
      await settle(3);
      for (const device of others) {
        expect(texts(device.engine.getMessages(g))).toContain(`hello ${size}`);
      }
      // One member leaves, the creator removes another; the rest still talk.
      await at(others, 0).engine.leave(g);
      await a.engine.removeMember(g, at(others, 1).user.profileId);
      await settle(3);
      await at(others, 2).engine.send(g, { text: `after changes ${size}` });
      await settle(3);
      expect(texts(a.engine.getMessages(g))).toContain(`after changes ${size}`);
      expect(texts(at(others, 1).engine.getMessages(g))).not.toContain(
        `after changes ${size}`
      );
      expect(a.engine.getConversation(g)?.safetyCode).toBe(
        others.at(-1)!.engine.getConversation(g)?.safetyCode
      );
      process.stderr.write(
        `[real-stack] ${size}-person group created and delivered in ${created} ms
`
      );
    }
  });
});
