/**
 * @jest-environment node
 */
import type { PersonalRecordsMode } from "@/lib/personal-records/personal-records-mode";
import type { RecordDraft } from "@/lib/signed-records/sign-records";
import type { SignedRecordEvent } from "@/lib/signed-records/record-event";
import type { SealedItem } from "@/lib/signed-records/sealed-crypto";

const WALLET = "0x1111111111111111111111111111111111111111";
const DEVICE_KEY = `0x${"d7".repeat(32)}`;
const AUTH_REF = `0x${"e0".repeat(32)}`;
const OWNER = `0x${"00".repeat(31)}01`;
const TARGET = `0x${"00".repeat(31)}02`;
const READER = "0x0000000000000000000000000000000000000009";
const SENDER_KEY = new Uint8Array(32).map((_, i) => i);
const PROFILE_ID = "profile-1";

let mockWallet: string | null = WALLET;
let mockAccounts: {
  address: string;
  role: string | null;
  profileId: string | null;
}[] = [];
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: () => mockWallet,
  getConnectedWalletAccounts: () => mockAccounts,
}));

const mockReadUsableDeviceGrant = jest.fn();
jest.mock("@/lib/device-signing/device-key-store", () => ({
  readUsableDeviceGrant: (...args: unknown[]) =>
    mockReadUsableDeviceGrant(...args),
}));

const mockFetchRecordAnchor = jest.fn();
jest.mock("@/lib/signed-records/record-anchor", () => ({
  fetchRecordAnchor: (...args: unknown[]) => mockFetchRecordAnchor(...args),
}));

let mockSenderGen = 1_795_000_000;
jest.mock("@/lib/signed-records/sender-keys", () => ({
  getOrCreateSenderKey: async (deviceKey: string, cls: number) => ({
    deviceKey,
    cls,
    gen: mockSenderGen,
    key: SENDER_KEY,
  }),
}));

const mockSignRecords = jest.fn();
jest.mock("@/lib/signed-records/sign-records", () => ({
  ...jest.requireActual("@/lib/signed-records/sign-records"),
  signRecords: (...args: unknown[]) => mockSignRecords(...args),
}));

const mockPost = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: (...args: unknown[]) => mockPost(...args),
}));

import { submitPersonalChange } from "@/lib/personal-records/personal-records-submit";
import { canonicalJson } from "@/lib/device-signing/canonical-json";
import {
  fromBase64Url,
  openSealedItems,
  SealedClass,
} from "@/lib/signed-records/sealed-crypto";
import { RecordKind } from "@/lib/signed-records/record-kinds";

/** The RFC 9180 A.1 recipient key the shared vectors use. */
const PROVIDER_PUBLIC_KEY =
  "0x3948cfe0ad1ddb695d780e59077195da6c56506b027329794ab02bca80815c4d";

const PRIMARY = { companion: false };
const COMPANION = { companion: true };

const modeOf = (overrides: Partial<PersonalRecordsMode> = {}) =>
  ({
    mode: "primary",
    frozen: false,
    owner: OWNER,
    siteReader: READER,
    providerKeys: [{ id: "6529io-test", publicKey: PROVIDER_PUBLIC_KEY }],
    ...overrides,
  }) as PersonalRecordsMode;

const mute = {
  follows: [],
  items: [{ t: "mute", k: TARGET, b: {} }] as SealedItem[],
};
const follow = {
  follows: [
    {
      key: `identity:${TARGET}`,
      actions: ["WAVE_CREATED", "DROP_CREATED", "DROP_REPLIED"],
    },
  ],
  items: [],
};
const pins = (count: number) => ({
  follows: [],
  items: Array.from(
    { length: count },
    (_, index): SealedItem => ({
      t: "pin",
      k: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      b: { pos: index },
    })
  ),
});

let signedCount = 0;

/** signRecords as a fake: one event per draft, each with its own id. */
const signedFrom = (drafts: readonly RecordDraft[], deviceKey = DEVICE_KEY) =>
  drafts.map((draft): SignedRecordEvent => {
    signedCount += 1;
    return {
      id: `0x${String(signedCount).padStart(64, "0")}`,
      kind: draft.kind,
      kind_version: 1,
      wave: draft.wave,
      author: WALLET,
      key_type: 2,
      device_key: deviceKey,
      auth_ref: AUTH_REF,
      seq: 1000 + signedCount,
      anchor: 500,
      claimed_time: Date.now(),
      refs: [...draft.refs],
      body: draft.body === null ? null : JSON.stringify(draft.body),
      body_hash: `0x${"00".repeat(32)}`,
      body_size: 0,
      signature: `0x${"00".repeat(64)}`,
    };
  });

const draftsSigned = (call = 0): RecordDraft[] =>
  mockSignRecords.mock.calls[call]![0];

interface PostRequest {
  readonly body: {
    readonly events: SignedRecordEvent[];
    readonly companion?: boolean;
  };
}

const postedEvents = (call = 0): SignedRecordEvent[] =>
  (mockPost.mock.calls[call]![0] as PostRequest).body.events;

const answerAll =
  (outcome: string, mode = "primary") =>
  async (request: PostRequest) => ({
    mode,
    results: request.body.events.map((event) => ({ id: event.id, outcome })),
  });

const sealedItemsOf = async (draft: RecordDraft) =>
  (
    await openSealedItems({
      wave: `pv/${OWNER}`,
      bytes: fromBase64Url((draft.body as { c: string }).c),
      senderKey: SENDER_KEY,
    })
  ).items;

const keysDocumentOf = (draft: RecordDraft) => {
  const bytes = fromBase64Url((draft.body as { c: string }).c);
  expect(bytes[0]).toBe(0x02);
  return JSON.parse(new TextDecoder().decode(bytes.subarray(1))) as {
    v: number;
    dev: string;
    box: null;
    wraps: { cls: number; gen: number; from: string; to: string }[];
  };
};

const storage = new Map<string, string>();

beforeEach(() => {
  jest.clearAllMocks();
  storage.clear();
  signedCount = 0;
  mockSenderGen = 1_795_000_000;
  mockWallet = WALLET;
  mockAccounts = [{ address: WALLET, role: PROFILE_ID, profileId: PROFILE_ID }];
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  });
  mockReadUsableDeviceGrant.mockResolvedValue({
    record: {},
    grant: {
      id: AUTH_REF,
      device_key: DEVICE_KEY.toUpperCase().replace("0X", "0x"),
    },
  });
  mockFetchRecordAnchor.mockResolvedValue({
    anchor: 500,
    finalizedTime: 0,
    maxAnchorLag: 120,
  });
  mockSignRecords.mockImplementation(async (drafts: RecordDraft[]) => ({
    status: "signed",
    events: signedFrom(drafts),
    grantId: AUTH_REF,
  }));
  mockPost.mockImplementation(answerAll("applied"));
});

describe("what a submit carries", () => {
  it("a follow of a person is one ps RECORD and nothing private", async () => {
    await expect(
      submitPersonalChange(follow, modeOf(), PRIMARY)
    ).resolves.toEqual({ status: "saved" });
    expect(draftsSigned()).toEqual([
      {
        kind: RecordKind.RECORD,
        wave: `ps/${OWNER}`,
        refs: ["follow", `identity:${TARGET}`],
        body: { actions: ["WAVE_CREATED", "DROP_CREATED", "DROP_REPLIED"] },
      },
    ]);
    expect(mockSignRecords).toHaveBeenCalledWith(expect.any(Array), {
      anchor: 500,
    });
    expect(mockReadUsableDeviceGrant).not.toHaveBeenCalled();
  });

  it("an unfollow is a RECORD with no body", async () => {
    await submitPersonalChange(
      { follows: [{ key: `identity:${TARGET}`, actions: null }], items: [] },
      modeOf(),
      PRIMARY
    );
    expect(draftsSigned()).toEqual([
      expect.objectContaining({
        refs: ["follow", `identity:${TARGET}`],
        body: null,
      }),
    ]);
  });

  it("private items: sealed settings, the device's keys record and the reader record", async () => {
    await expect(
      submitPersonalChange(mute, modeOf(), PRIMARY)
    ).resolves.toEqual({ status: "saved" });
    const [settings, keys, reader] = draftsSigned();
    expect(draftsSigned()).toHaveLength(3);

    expect(settings).toMatchObject({
      kind: RecordKind.SEALED,
      wave: `pv/${OWNER}`,
      refs: ["settings"],
    });
    await expect(
      openSealedItems({
        wave: `pv/${OWNER}`,
        bytes: fromBase64Url((settings!.body as { c: string }).c),
        senderKey: SENDER_KEY,
      })
    ).resolves.toEqual({
      cls: SealedClass.PROVIDER,
      gen: mockSenderGen,
      deviceKey: DEVICE_KEY,
      items: mute.items,
    });

    expect(keys).toMatchObject({
      kind: RecordKind.SEALED,
      wave: `pv/${OWNER}`,
      refs: ["keys"],
    });
    const document = keysDocumentOf(keys!);
    expect(document).toMatchObject({ v: 1, dev: DEVICE_KEY, box: null });
    expect(document.wraps).toEqual([
      expect.objectContaining({
        cls: SealedClass.PROVIDER,
        gen: mockSenderGen,
        from: DEVICE_KEY,
        to: "svc:6529io-test",
      }),
    ]);

    expect(reader).toEqual({
      kind: RecordKind.RECORD,
      wave: `pv/${OWNER}`,
      refs: ["reader", READER],
      body: {},
    });
    expect(mockPost).toHaveBeenCalledWith({
      endpoint: "signed-records",
      body: { events: expect.any(Array) },
      errorMode: "structured",
      // Aborted if the API doesn't answer within the submit's time limit.
      signal: expect.any(AbortSignal),
    });
  });

  it("a wave follow is a sealed item, never a public record", async () => {
    const waveFollow = {
      follows: [],
      items: [
        { t: "follow", k: "wave:wave-1", b: { actions: ["DROP_CREATED"] } },
      ] as SealedItem[],
    };
    await submitPersonalChange(waveFollow, modeOf(), PRIMARY);
    const drafts = draftsSigned();
    expect(drafts.every((draft) => draft.wave === `pv/${OWNER}`)).toBe(true);
    await expect(sealedItemsOf(drafts[0]!)).resolves.toEqual(waveFollow.items);
  });

  it("wraps the sender key to every provider key", async () => {
    await submitPersonalChange(
      mute,
      modeOf({
        providerKeys: [
          { id: "key-1", publicKey: PROVIDER_PUBLIC_KEY },
          { id: "key-2", publicKey: PROVIDER_PUBLIC_KEY },
        ],
      }),
      PRIMARY
    );
    expect(keysDocumentOf(draftsSigned()[1]!).wraps.map((w) => w.to)).toEqual([
      "svc:key-1",
      "svc:key-2",
    ]);
  });

  it("puts a block's follow unset and the block in one submit", async () => {
    await submitPersonalChange(
      {
        follows: [{ key: `identity:${TARGET}`, actions: null }],
        items: [{ t: "block", k: TARGET, b: {} }],
      },
      modeOf({ siteReader: null }),
      PRIMARY
    );
    expect(draftsSigned().map((draft) => draft.refs[0])).toEqual([
      "follow",
      "settings",
      "keys",
    ]);
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("sends the reader record once per owner and site reader", async () => {
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    expect(postedEvents(0).map((event) => event.refs[0])).toEqual([
      "settings",
      "keys",
      "reader",
    ]);
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    expect(postedEvents(1).map((event) => event.refs[0])).toEqual([
      "settings",
      "keys",
    ]);
  });

  it("sends the reader record again when it was not taken", async () => {
    mockPost.mockImplementation(async (request: PostRequest) => ({
      mode: "primary",
      results: request.body.events.map((event) => ({
        id: event.id,
        outcome: event.refs[0] === "reader" ? "refused" : "applied",
        reason: "provider-unavailable",
      })),
    }));
    await expect(
      submitPersonalChange(mute, modeOf(), PRIMARY)
    ).resolves.toEqual({ status: "saved" });
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    expect(postedEvents(1).map((event) => event.refs[0])).toContain("reader");
  });

  it("sends no reader record until the site reader is configured", async () => {
    await submitPersonalChange(mute, modeOf({ siteReader: null }), PRIMARY);
    expect(draftsSigned()).toHaveLength(2);
  });
});

describe("the keys record", () => {
  const keysEventOf = (call: number) =>
    postedEvents(call).find((event) => event.refs[0] === "keys")!;

  it("is signed once and the same event goes with later submits", async () => {
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    expect(keysEventOf(1).id).toBe(keysEventOf(0).id);
    expect(draftsSigned(1).map((draft) => draft.refs[0])).toEqual(["settings"]);
  });

  it("is signed again for a new sender-key generation", async () => {
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    mockSenderGen += 1;
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    expect(keysEventOf(1).id).not.toBe(keysEventOf(0).id);
  });

  it("is signed again when the provider keys change", async () => {
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    await submitPersonalChange(
      mute,
      modeOf({
        providerKeys: [
          { id: "6529io-test", publicKey: PROVIDER_PUBLIC_KEY },
          { id: "key-2", publicKey: PROVIDER_PUBLIC_KEY },
        ],
      }),
      PRIMARY
    );
    expect(keysEventOf(1).id).not.toBe(keysEventOf(0).id);
  });

  it("is signed again when the stored one can't be read", async () => {
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    for (const key of storage.keys()) {
      if (key.startsWith("6529-personal-records-keys:")) {
        storage.set(key, "{not json");
      }
    }
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    expect(keysEventOf(1).id).not.toBe(keysEventOf(0).id);
  });

  it("is signed again before it leaves the anchor window", async () => {
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    mockFetchRecordAnchor.mockResolvedValue({
      anchor: 500 + 115,
      finalizedTime: 0,
      maxAnchorLag: 120,
    });
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    expect(keysEventOf(1).id).not.toBe(keysEventOf(0).id);
  });

  it("is signed again once its claimed time nears the API's 10-minute window", async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(now);
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    clock.mockReturnValue(now + 7 * 60 * 1000);
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    clock.mockReturnValue(now + 9 * 60 * 1000);
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    clock.mockRestore();
    expect(keysEventOf(1).id).toBe(keysEventOf(0).id);
    expect(keysEventOf(2).id).not.toBe(keysEventOf(0).id);
  });

  it("is signed again and the action resent once when the API says its anchor is too old", async () => {
    await submitPersonalChange(mute, modeOf(), PRIMARY);
    const firstKeys = keysEventOf(0).id;
    mockPost.mockImplementationOnce(async (request: PostRequest) => ({
      mode: "primary",
      results: request.body.events.map((event) =>
        event.refs[0] === "keys"
          ? { id: event.id, outcome: "rejected", reason: "anchor" }
          : { id: event.id, outcome: "refused", reason: "no-sender-key" }
      ),
    }));
    await expect(
      submitPersonalChange(mute, modeOf(), PRIMARY)
    ).resolves.toEqual({ status: "saved" });
    expect(mockPost).toHaveBeenCalledTimes(3);
    expect(keysEventOf(1).id).toBe(firstKeys);
    expect(keysEventOf(2).id).not.toBe(firstKeys);
  });
});

describe("a newer change saved elsewhere (OUT_OF_ORDER)", () => {
  const outOfOrder = (time: number) => async (request: PostRequest) => ({
    mode: "primary",
    results: request.body.events.map((event) =>
      event.refs[0] === "settings"
        ? {
            id: event.id,
            outcome: "refused",
            reason: "out-of-order",
            code: "OUT_OF_ORDER",
            detail: `A newer change of yours is already saved (anchor 501, time ${time}). Sign this one again.`,
          }
        : { id: event.id, outcome: "logged" }
    ),
  });

  it("signs again once with a fresh anchor and a later claimed time", async () => {
    const newer = Date.now() + 90_000;
    mockPost.mockImplementationOnce(outOfOrder(newer));
    await expect(
      submitPersonalChange(mute, modeOf(), PRIMARY)
    ).resolves.toEqual({ status: "saved" });
    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(mockFetchRecordAnchor).toHaveBeenNthCalledWith(
      1,
      expect.any(Number),
      {
        fresh: false,
      }
    );
    expect(mockFetchRecordAnchor).toHaveBeenNthCalledWith(
      2,
      expect.any(Number),
      {
        fresh: true,
      }
    );
    expect(mockSignRecords.mock.calls[1]![1]).toEqual({
      anchor: 500,
      notBefore: newer + 1,
    });
  });

  it("says so plainly when signing again did not help", async () => {
    mockPost.mockImplementation(outOfOrder(Date.now()));
    await expect(
      submitPersonalChange(mute, modeOf(), PRIMARY)
    ).resolves.toEqual({
      status: "not-saved",
      reason: "out-of-order",
      code: "OUT_OF_ORDER",
      message:
        "A newer change from another device or tab came first. Reload and try again.",
    });
    expect(mockPost).toHaveBeenCalledTimes(2);
  });
});

describe("a burst of changes from one person", () => {
  const followOf = (index: number) => ({
    follows: [
      {
        key: `identity:0x${String(index + 10).padStart(64, "0")}`,
        actions: ["DROP_CREATED"],
      },
    ],
    items: [],
  });

  it("saves all 50 follows of a follow-all, sending one submit at a time", async () => {
    // The API's owner mark: a record ordered before the newest one applied
    // is refused. Later requests overtake earlier ones on the way there.
    let mark: { time: number; id: string } | null = null;
    let arrivals = 0;
    let inFlight = 0;
    let mostInFlight = 0;
    mockPost.mockImplementation(async (request: PostRequest) => {
      inFlight += 1;
      mostInFlight = Math.max(mostInFlight, inFlight);
      arrivals += 1;
      await new Promise((resolve) => setTimeout(resolve, 5 - (arrivals % 5)));
      inFlight -= 1;
      return {
        mode: "primary",
        results: request.body.events.map((event) => {
          const older =
            mark !== null &&
            (event.claimed_time < mark.time ||
              (event.claimed_time === mark.time && event.id < mark.id));
          if (older) {
            return {
              id: event.id,
              outcome: "refused",
              reason: "out-of-order",
              code: "OUT_OF_ORDER",
              detail: `A newer change of yours is already saved (anchor 500, time ${mark!.time}). Sign this one again.`,
            };
          }
          mark = { time: event.claimed_time, id: event.id };
          return { id: event.id, outcome: "applied" };
        }),
      };
    });
    const outcomes = await Promise.all(
      Array.from({ length: 50 }, (_, index) =>
        submitPersonalChange(followOf(index), modeOf(), PRIMARY)
      )
    );
    expect(outcomes).toEqual(Array(50).fill({ status: "saved" }));
    expect(mostInFlight).toBe(1);
    // None needed signing again.
    expect(mockPost).toHaveBeenCalledTimes(50);
  });

  it("builds a change given as a builder only after the one before has its answer", async () => {
    const order: string[] = [];
    let answerFirst: () => void = () => undefined;
    mockPost.mockImplementationOnce(async (request: PostRequest) => {
      order.push("first sent");
      await new Promise<void>((resolve) => {
        answerFirst = resolve;
      });
      order.push("first answered");
      return answerAll("applied")(request);
    });
    const first = submitPersonalChange(followOf(0), modeOf(), PRIMARY);
    const second = submitPersonalChange(
      async () => {
        order.push("second built");
        return followOf(1);
      },
      modeOf(),
      PRIMARY
    );
    while (!order.includes("first sent")) {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
    answerFirst();
    await expect(Promise.all([first, second])).resolves.toEqual([
      { status: "saved" },
      { status: "saved" },
    ]);
    expect(order).toEqual(["first sent", "first answered", "second built"]);
  });

  it("gives up on a submit or an anchor that never answers, and the next change goes on", async () => {
    jest.useFakeTimers();
    try {
      mockPost.mockImplementationOnce(() => new Promise(() => undefined));
      const stalledPost = submitPersonalChange(followOf(0), modeOf(), PRIMARY);
      const next = submitPersonalChange(followOf(1), modeOf(), PRIMARY);
      await jest.advanceTimersByTimeAsync(31_000);
      // The API may still take it: the person is told to check, not to retry.
      await expect(stalledPost).resolves.toMatchObject({
        status: "not-saved",
        reason: "timeout",
        message:
          "The change took too long and may still be saved. Reload in a moment to check before you try again.",
      });
      await expect(next).resolves.toEqual({ status: "saved" });

      mockFetchRecordAnchor.mockImplementationOnce(
        () => new Promise(() => undefined)
      );
      const stalledAnchor = submitPersonalChange(
        followOf(2),
        modeOf(),
        PRIMARY
      );
      await jest.advanceTimersByTimeAsync(16_000);
      await expect(stalledAnchor).resolves.toMatchObject({
        status: "not-saved",
        reason: "unavailable",
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it("goes on with the next change after one fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("503"));
    const first = submitPersonalChange(followOf(0), modeOf(), PRIMARY);
    const second = submitPersonalChange(followOf(1), modeOf(), PRIMARY);
    await expect(first).rejects.toThrow("503");
    await expect(second).resolves.toEqual({ status: "saved" });
  });
});

describe("large actions", () => {
  it("splits a 1,000-pin reorder across settings records under 30 KiB each", async () => {
    const reorder = pins(1000);
    await expect(
      submitPersonalChange(reorder, modeOf({ siteReader: null }), PRIMARY)
    ).resolves.toEqual({ status: "saved" });
    const settings = draftsSigned().filter(
      (draft) => draft.refs[0] === "settings"
    );
    expect(settings.length).toBeGreaterThan(1);
    const opened: SealedItem[] = [];
    for (const draft of settings) {
      const items = await sealedItemsOf(draft);
      expect(
        new TextEncoder().encode(canonicalJson({ items, v: 1 })).length
      ).toBeLessThanOrEqual(30 * 1024);
      opened.push(...items);
    }
    expect(opened).toEqual(reorder.items);
    // One submit: the settings records and the keys record.
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(postedEvents(0).length).toBeLessThanOrEqual(16);
  });

  it("sends an action that needs more than 16 records in several submits, each with the keys record", async () => {
    const reorder = pins(8000);
    await expect(
      submitPersonalChange(reorder, modeOf(), PRIMARY)
    ).resolves.toEqual({ status: "saved" });
    const submits = mockPost.mock.calls.map((_, call) => postedEvents(call));
    expect(submits.length).toBeGreaterThan(1);
    const keysIds = new Set<string>();
    for (const [index, events] of submits.entries()) {
      expect(events.length).toBeLessThanOrEqual(16);
      const roles = events.map((event) => event.refs[0]);
      expect(roles.filter((role) => role === "keys")).toHaveLength(1);
      expect(roles.includes("reader")).toBe(index === 0);
      keysIds.add(events.find((event) => event.refs[0] === "keys")!.id);
    }
    // The one keys record, signed once.
    expect(keysIds.size).toBe(1);
    expect(mockSignRecords).toHaveBeenCalledTimes(1);
    const opened: SealedItem[] = [];
    for (const events of submits) {
      for (const event of events.filter((e) => e.refs[0] === "settings")) {
        opened.push(
          ...(await sealedItemsOf({
            kind: RecordKind.SEALED,
            wave: event.wave,
            refs: event.refs,
            body: JSON.parse(event.body ?? "{}"),
          }))
        );
      }
    }
    expect(opened).toEqual(reorder.items);
  });

  it("stops at the first submit that fails", async () => {
    mockPost.mockImplementation(async (request: PostRequest) => ({
      mode: "primary",
      results: request.body.events.map((event) => ({
        id: event.id,
        outcome: event.refs[0] === "settings" ? "refused" : "logged",
        reason: "invalid-change",
        detail: "A pin's pos is a whole number from 0 to 1000000",
      })),
    }));
    await expect(
      submitPersonalChange(pins(8000), modeOf(), PRIMARY)
    ).resolves.toMatchObject({
      status: "not-saved",
      message: "A pin's pos is a whole number from 0 to 1000000",
    });
    expect(mockPost).toHaveBeenCalledTimes(1);
  });
});

describe("the mode", () => {
  it("marks shadow records as companions of today's request", async () => {
    mockPost.mockImplementation(answerAll("applied", "shadow"));
    await expect(
      submitPersonalChange(mute, modeOf({ mode: "shadow" }), COMPANION)
    ).resolves.toEqual({ status: "saved" });
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { events: expect.any(Array), companion: true },
      })
    );
  });

  it("calls nothing saved that the API took in another mode than primary", async () => {
    mockPost.mockImplementation(answerAll("applied", "shadow"));
    await expect(
      submitPersonalChange(mute, modeOf(), PRIMARY)
    ).resolves.toEqual({ status: "mode-changed" });
  });
});

describe("what the person is told", () => {
  it("a refusal's detail", async () => {
    mockPost.mockResolvedValue({
      mode: "primary",
      results: [
        {
          id: "0x1",
          outcome: "refused",
          reason: "rule",
          code: "BLOCKED",
          detail: "You can't follow a profile you have blocked.",
        },
      ],
    });
    await expect(
      submitPersonalChange(follow, modeOf(), PRIMARY)
    ).resolves.toEqual({
      status: "not-saved",
      reason: "rule",
      code: "BLOCKED",
      message: "You can't follow a profile you have blocked.",
    });
  });

  it("today's message for a rule code without detail", async () => {
    mockPost.mockResolvedValue({
      mode: "primary",
      results: [
        {
          id: "0x1",
          outcome: "refused",
          reason: "rule",
          code: "WAVE_NOT_FOUND",
        },
      ],
    });
    await expect(
      submitPersonalChange(follow, modeOf(), PRIMARY)
    ).resolves.toMatchObject({
      status: "not-saved",
      code: "WAVE_NOT_FOUND",
      message: "That wave does not exist.",
    });
  });

  it("a plain retry message for a failed verification", async () => {
    mockPost.mockResolvedValue({
      mode: "primary",
      results: [
        { id: "0x1", outcome: "rejected", reason: "anchor", detail: "stale" },
      ],
    });
    await expect(
      submitPersonalChange(follow, modeOf(), PRIMARY)
    ).resolves.toEqual({
      status: "not-saved",
      reason: "anchor",
      code: undefined,
      message: "The setting wasn't saved. Try again.",
    });
  });

  it("a stale change is saved (a newer one is already in)", async () => {
    mockPost.mockImplementation(answerAll("stale"));
    await expect(
      submitPersonalChange(follow, modeOf(), PRIMARY)
    ).resolves.toEqual({ status: "saved" });
  });

  it("the settings record's refusal, not the keys record's outcome", async () => {
    mockPost.mockImplementation(async (request: PostRequest) => ({
      mode: "primary",
      results: request.body.events.map((event) =>
        event.refs[0] === "settings"
          ? {
              id: event.id,
              outcome: "refused",
              reason: "rule",
              code: "SELF",
              detail: "You can't mute yourself.",
            }
          : { id: event.id, outcome: "logged" }
      ),
    }));
    await expect(
      submitPersonalChange(mute, modeOf(), PRIMARY)
    ).resolves.toMatchObject({
      status: "not-saved",
      message: "You can't mute yourself.",
    });
  });

  it("that proxies can't change settings", async () => {
    mockAccounts = [
      { address: WALLET, role: "another-profile", profileId: PROFILE_ID },
    ];
    await expect(
      submitPersonalChange(mute, modeOf(), PRIMARY)
    ).resolves.toEqual({
      status: "not-saved",
      reason: "proxy",
      code: undefined,
      message: "Proxies can't change settings.",
    });
    expect(mockSignRecords).not.toHaveBeenCalled();
  });
});

describe("when nothing can be signed", () => {
  it("no owner (signed out, or the chain is unavailable)", async () => {
    await expect(
      submitPersonalChange(follow, modeOf({ owner: null }), PRIMARY)
    ).resolves.toMatchObject({ status: "not-saved", reason: "unavailable" });
    expect(mockSignRecords).not.toHaveBeenCalled();
  });

  it("no wallet", async () => {
    mockWallet = null;
    await expect(
      submitPersonalChange(follow, modeOf(), PRIMARY)
    ).resolves.toEqual({ status: "no-grant" });
  });

  it("no usable grant on this device for private items", async () => {
    mockReadUsableDeviceGrant.mockResolvedValue(null);
    await expect(
      submitPersonalChange(mute, modeOf(), PRIMARY)
    ).resolves.toEqual({ status: "no-grant" });
    expect(mockSignRecords).not.toHaveBeenCalled();
  });

  it("a wallet bound to no principal has no private stream", async () => {
    await expect(
      submitPersonalChange(mute, modeOf({ owner: WALLET }), PRIMARY)
    ).resolves.toMatchObject({ status: "not-saved", reason: "no-principal" });
    expect(mockSignRecords).not.toHaveBeenCalled();
  });

  it("a wallet bound to no principal still follows people (ps/<wallet>)", async () => {
    await expect(
      submitPersonalChange(follow, modeOf({ owner: WALLET }), PRIMARY)
    ).resolves.toEqual({ status: "saved" });
    expect(draftsSigned()[0]).toMatchObject({ wave: `ps/${WALLET}` });
  });

  it("no provider keys for private items", async () => {
    await expect(
      submitPersonalChange(mute, modeOf({ providerKeys: [] }), PRIMARY)
    ).resolves.toMatchObject({ status: "not-saved", reason: "unavailable" });
  });

  it("no anchor (503 ANCHOR_UNAVAILABLE)", async () => {
    mockFetchRecordAnchor.mockRejectedValue(new Error("503"));
    await expect(
      submitPersonalChange(follow, modeOf(), PRIMARY)
    ).resolves.toMatchObject({ status: "not-saved", reason: "unavailable" });
    expect(mockSignRecords).not.toHaveBeenCalled();
  });

  it("signRecords answers no-grant (no post scope, no Ed25519)", async () => {
    mockSignRecords.mockResolvedValue({ status: "no-grant" });
    await expect(
      submitPersonalChange(follow, modeOf(), PRIMARY)
    ).resolves.toEqual({ status: "no-grant" });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("signing timed out", async () => {
    mockSignRecords.mockResolvedValue({ status: "failed", reason: "timeout" });
    await expect(
      submitPersonalChange(follow, modeOf(), PRIMARY)
    ).resolves.toMatchObject({ status: "not-saved", reason: "signing" });
  });

  it("the grant changed between sealing and signing", async () => {
    mockSignRecords.mockImplementation(async (drafts: RecordDraft[]) => ({
      status: "signed",
      events: signedFrom(drafts, `0x${"ee".repeat(32)}`),
      grantId: "0x2",
    }));
    await expect(
      submitPersonalChange(mute, modeOf(), PRIMARY)
    ).resolves.toMatchObject({ status: "not-saved", reason: "signing" });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("passes HTTP errors through (409, 503)", async () => {
    const conflict = Object.assign(new Error("off"), { status: 409 });
    mockPost.mockRejectedValue(conflict);
    await expect(submitPersonalChange(follow, modeOf(), PRIMARY)).rejects.toBe(
      conflict
    );
  });
});
