import { useDropSealStates } from "@/components/waves/drops/signature/dropSignatureVerdicts";
import type { DropSignatureVerdict } from "@/lib/device-signing/verify-signed-events";
import { act, cleanup, renderHook } from "@testing-library/react";

jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => true,
}));

const mockFetchSignedEvents = jest.fn();
const mockFetchBatch = jest.fn();
const mockFetchAuthorWallets = jest.fn();
/** When each request of the current test started. */
const mockRequestTimes: number[] = [];
jest.mock("@/services/api/device-grants-api", () => {
  const started =
    (fetch: () => jest.Mock) =>
    (...args: unknown[]) => {
      mockRequestTimes.push(Date.now());
      return fetch()(...args);
    };
  return {
    fetchDropSignedEvents: started(() => mockFetchSignedEvents),
    fetchDropsSignedEvents: started(() => mockFetchBatch),
    fetchAuthorWallets: started(() => mockFetchAuthorWallets),
  };
});

const serverError = () =>
  Object.assign(new Error("Server error"), { status: 500 });

/** No second of the test started more than two requests. */
const expectWithinBudget = () => {
  mockRequestTimes.forEach((time) => {
    expect(
      mockRequestTimes.filter((other) => other >= time && other < time + 1000)
        .length
    ).toBeLessThanOrEqual(2);
  });
};

const mockVerify = jest.fn();
jest.mock("@/lib/device-signing/verify-signed-events", () => ({
  ...jest.requireActual("@/lib/device-signing/verify-signed-events"),
  verifyDropSignedEvents: (...args: unknown[]) => mockVerify(...args),
}));

const AUTHOR = "0x1111111111111111111111111111111111111111";
const signedVerdict: DropSignatureVerdict = {
  status: "signed",
  currentContentSigned: true,
  signature: {
    eventId: `0x${"e".repeat(64)}`,
    wallet: AUTHOR,
    deviceKey: `0x${"d".repeat(64)}`,
    grantExpiresAt: Date.UTC(2027, 3, 16),
    walletSignature: "verified",
    origin: "6529.io",
  },
};

let nextId = 0;
let nextAuthor = 0;
/** A fresh author, so the identity lookup is not already cached. */
const anAuthor = () => ({
  primary_address: `0x${(nextAuthor += 1).toString(16).padStart(40, "b")}`,
});

const aDrop = (overrides: Record<string, unknown> = {}) =>
  ({
    id: `batch-drop-${(nextId += 1)}`,
    is_author_signed: true,
    title: null,
    parts: [{ content: "gm", media: [], attachments: [], quoted_drop: null }],
    wave: { id: "wave-1" },
    author: anAuthor(),
    ...overrides,
  }) as any;

const eventFor = (dropId: string) => ({
  id: `0x${dropId}`,
  kind: 1,
  auth_ref: "0xgrant",
});
const GRANT = { id: "0xGRANT", wallet: AUTHOR };

const signedEventsFor = (dropId: string) => ({
  drop_id: dropId,
  current_event_id: `0x${dropId}`,
  events: [eventFor(dropId)],
  grants: [],
});

const batchFor = (dropIds: readonly string[]) => ({
  drops: dropIds.map(signedEventsFor),
  grants: [GRANT],
  unavailable: [],
  truncated_drop_ids: [],
});

const batchReads = () =>
  mockFetchBatch.mock.calls.map(([dropIds]) => dropIds as string[]);

/** The signed-events data each verification received, by drop id. */
const verifiedData = () =>
  new Map(
    mockVerify.mock.calls.map(([data]) => [data.drop_id as string, data])
  );

const BATCH_WINDOW_MS = 100;

const flush = async (ms = BATCH_WINDOW_MS) => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
};

let clock = Date.UTC(2028, 0, 1);

describe("seal checks reading signed events in batches", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clock += 60 * 60_000;
    jest.setSystemTime(clock);
    mockFetchSignedEvents
      .mockReset()
      .mockImplementation((dropId: string) =>
        Promise.resolve(signedEventsFor(dropId))
      );
    mockFetchBatch
      .mockReset()
      .mockImplementation((dropIds: string[]) =>
        Promise.resolve(batchFor(dropIds))
      );
    mockFetchAuthorWallets.mockReset().mockResolvedValue([AUTHOR]);
    mockVerify.mockReset().mockResolvedValue(signedVerdict);
    mockRequestTimes.length = 0;
  });

  afterEach(async () => {
    cleanup();
    await flush(10 * 60_000);
    clock = Date.now();
    jest.useRealTimers();
  });

  it("reads the signed events of posts that come into view together in one request", async () => {
    const author = anAuthor();
    const drops = Array.from({ length: 20 }, () => aDrop({ author }));
    const { result } = renderHook(() => useDropSealStates(drops, true));
    await flush(60_000);

    expect(result.current).toEqual(Array(20).fill("verified"));
    expect(batchReads()).toEqual([drops.map(({ id }) => id)]);
    expect(mockFetchSignedEvents).not.toHaveBeenCalled();
    // Each drop is verified with its own events and the grants they use,
    // the same data the single-drop route returns.
    expect(mockVerify).toHaveBeenCalledTimes(20);
    expect(verifiedData().get(drops[3].id)).toEqual({
      drop_id: drops[3].id,
      current_event_id: `0x${drops[3].id}`,
      events: [eventFor(drops[3].id)],
      grants: [GRANT],
    });
  });

  it("issues one signed-event read and one lookup per author for a page of posts", async () => {
    // Twenty posts by five authors: before batching this took twenty
    // signed-event reads and five identity lookups.
    const authors = Array.from({ length: 5 }, anAuthor);
    const drops = Array.from({ length: 20 }, (_, index) =>
      aDrop({ author: authors[index % 5] })
    );
    renderHook(() => useDropSealStates(drops, true));
    await flush(60_000);
    expect(mockFetchBatch).toHaveBeenCalledTimes(1);
    expect(mockFetchSignedEvents).not.toHaveBeenCalled();
    expect(mockFetchAuthorWallets).toHaveBeenCalledTimes(5);
  });

  it("reads checks due within the window together and later ones in the next read", async () => {
    const [first, second, third] = [aDrop(), aDrop(), aDrop()];
    renderHook(() => useDropSealStates([first], true));
    await flush(50);
    renderHook(() => useDropSealStates([second], true));
    await flush(50);
    expect(batchReads()).toEqual([[first.id, second.id]]);

    await flush(400);
    renderHook(() => useDropSealStates([third], true));
    await flush(5000);
    expect(batchReads()).toEqual([[first.id, second.id], [third.id]]);
  });

  it("names at most 50 drops per read: 51 posts take two reads", async () => {
    const author = anAuthor();
    const drops = Array.from({ length: 51 }, () => aDrop({ author }));
    const { result } = renderHook(() => useDropSealStates(drops, true));
    await flush(60_000);
    const reads = batchReads();
    expect(reads.map((ids) => ids.length)).toEqual([50, 1]);
    expect(reads.flat()).toEqual(drops.map(({ id }) => id));
    expect(result.current).toEqual(Array(51).fill("verified"));
  });

  it("keeps at most two checks in flight while a read brings many drops", async () => {
    let resolveAll!: () => void;
    const gate = new Promise<void>((resolve) => {
      resolveAll = resolve;
    });
    mockVerify.mockImplementation(() => gate.then(() => signedVerdict));
    const author = anAuthor();
    const drops = Array.from({ length: 10 }, () => aDrop({ author }));
    const { result } = renderHook(() => useDropSealStates(drops, true));
    await flush(10_000);
    expect(mockFetchBatch).toHaveBeenCalledTimes(1);
    expect(mockVerify).toHaveBeenCalledTimes(2);
    resolveAll();
    await flush(10_000);
    expect(result.current).toEqual(Array(10).fill("verified"));
  });

  it("reads a drop the batch names as truncated through the single-drop route", async () => {
    const [whole, truncated] = [aDrop(), aDrop()];
    mockFetchBatch.mockImplementation((dropIds: string[]) =>
      Promise.resolve({
        ...batchFor(dropIds),
        truncated_drop_ids: [truncated.id],
      })
    );
    const fullHistory = {
      ...signedEventsFor(truncated.id),
      events: [eventFor("first"), eventFor(truncated.id)],
      grants: [GRANT],
    };
    mockFetchSignedEvents.mockResolvedValue(fullHistory);
    const { result } = renderHook(() =>
      useDropSealStates([whole, truncated], true)
    );
    await flush(10_000);

    expect(result.current).toEqual(["verified", "verified"]);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(1);
    expect(mockFetchSignedEvents).toHaveBeenCalledWith(
      truncated.id,
      expect.any(AbortSignal)
    );
    expect(verifiedData().get(truncated.id)).toBe(fullHistory);
    expect(verifiedData().get(whole.id)).toMatchObject({
      events: [eventFor(whole.id)],
    });
  });

  it.each([
    [
      "lists it as unavailable (the single route's 404)",
      (dropIds: string[], drop: string) => ({
        ...batchFor(dropIds.filter((id) => id !== drop)),
        unavailable: [drop],
      }),
    ],
    [
      "leaves it out",
      (dropIds: string[], drop: string) =>
        batchFor(dropIds.filter((id) => id !== drop)),
    ],
  ])(
    "leaves a seal unverified, never failed, when the batch %s",
    async (_name, respond) => {
      const [shown, other] = [aDrop(), aDrop()];
      mockFetchBatch.mockImplementation((dropIds: string[]) =>
        Promise.resolve(respond(dropIds, shown.id))
      );
      const { result } = renderHook(() =>
        useDropSealStates([shown, other], true)
      );
      await flush(10_000);
      expect(result.current).toEqual(["unverified", "verified"]);
      expect(verifiedData().has(shown.id)).toBe(false);
      expect(mockFetchSignedEvents).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["answers 500", () => Promise.reject(serverError())],
    [
      "times out",
      (_dropIds: string[], signal: AbortSignal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    ],
    ["fails on the network", () => Promise.reject(new TypeError("Failed"))],
    ["is not a batch", () => Promise.resolve({ drops: "none" })],
  ])(
    "reads each post of a batch that %s through the single-drop route, within the budget",
    async (_name, respond) => {
      mockFetchBatch.mockImplementation(respond);
      const drops = Array.from({ length: 4 }, () => aDrop());
      const { result } = renderHook(() => useDropSealStates(drops, true));
      await flush(60_000);

      expect(result.current).toEqual(Array(4).fill("verified"));
      expect(mockFetchBatch).toHaveBeenCalledTimes(1);
      expect(mockFetchSignedEvents.mock.calls.map(([id]) => id)).toEqual(
        drops.map(({ id }) => id)
      );
      expect(verifiedData().get(drops[0].id)).toEqual(
        signedEventsFor(drops[0].id)
      );
      expectWithinBudget();
    }
  );

  it("leaves only the post whose own read also fails unverified, never failed", async () => {
    mockFetchBatch.mockRejectedValue(serverError());
    const drops = [aDrop(), aDrop(), aDrop()];
    mockFetchSignedEvents.mockImplementation((dropId: string) =>
      dropId === drops[1].id
        ? Promise.reject(serverError())
        : Promise.resolve(signedEventsFor(dropId))
    );
    const { result } = renderHook(() => useDropSealStates(drops, true));
    await flush(60_000);
    expect(result.current).toEqual(["verified", "unverified", "verified"]);

    // One fallback read per post: the failed one is not retried by itself.
    await flush(60 * 60_000);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(3);
    expect(mockFetchBatch).toHaveBeenCalledTimes(1);
    expectWithinBudget();
  });

  it("keeps a post whose fallback read failed unverified when re-shown, reading it again only once its content changes", async () => {
    mockFetchBatch.mockRejectedValueOnce(serverError());
    mockFetchSignedEvents.mockRejectedValueOnce(serverError());
    const drop = aDrop();
    const first = renderHook(() => useDropSealStates([drop], true));
    await flush(60_000);
    expect(first.result.current).toEqual(["unverified"]);
    first.unmount();

    // Seen again in the page session: no new read (the Signature dialog is
    // the retry), and the seal still says not yet verified.
    const again = renderHook(() => useDropSealStates([{ ...drop }], true));
    await flush(60 * 60_000);
    expect(again.result.current).toEqual(["unverified"]);
    expect(mockFetchBatch).toHaveBeenCalledTimes(1);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(1);
    again.unmount();

    // Edited content is a new check: it joins a batch read like any other.
    const edited = {
      ...drop,
      parts: [{ ...drop.parts[0], content: "gm, edited" }],
    };
    const { result } = renderHook(() => useDropSealStates([edited], true));
    await flush(60_000);
    expect(result.current).toEqual(["verified"]);
    expect(batchReads()).toEqual([[drop.id], [drop.id]]);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(1);
  });

  it("reads each drop exactly once after a 429 that came while some of its batch had started", async () => {
    mockFetchBatch.mockRejectedValueOnce(
      Object.assign(new Error("Too many requests"), {
        status: 429,
        headers: { get: () => null },
      })
    );
    const author = anAuthor();
    const drops = Array.from({ length: 5 }, () => aDrop({ author }));
    const { result } = renderHook(() => useDropSealStates(drops, true));
    // Two checks started on the batch's answer, three were still queued.
    await flush();
    expect(result.current).toEqual(Array(5).fill("pending"));

    await flush(60_000);
    expect(result.current).toEqual(Array(5).fill("verified"));
    const ids = drops.map(({ id }) => id);
    const [, afterPause, ...more] = batchReads();
    expect([...afterPause!].sort()).toEqual([...ids].sort());
    expect(more).toEqual([]);
    expect(mockFetchSignedEvents).not.toHaveBeenCalled();
    expect(mockVerify.mock.calls.map(([data]) => data.drop_id).sort()).toEqual(
      [...ids].sort()
    );
  });

  it("tries the batch read again for posts due after a failed one", async () => {
    mockFetchBatch.mockRejectedValueOnce(serverError());
    const first = [aDrop(), aDrop()];
    renderHook(() => useDropSealStates(first, true));
    await flush(60_000);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(2);

    const later = [aDrop(), aDrop()];
    const { result } = renderHook(() => useDropSealStates(later, true));
    await flush(60_000);
    expect(result.current).toEqual(["verified", "verified"]);
    expect(batchReads()).toEqual([
      first.map(({ id }) => id),
      later.map(({ id }) => id),
    ]);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(2);
  });

  it("falls back only for posts still wanted when the failed batch settles", async () => {
    let failBatch!: () => void;
    mockFetchBatch.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          failBatch = () => reject(serverError());
        })
    );
    const [kept, left] = [aDrop(), aDrop()];
    // Two checks in flight are taken by other posts, so these two wait.
    let releaseVerify!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseVerify = resolve;
    });
    mockVerify.mockImplementation(() => gate.then(() => signedVerdict));
    const busy = [aDrop(), aDrop()];
    renderHook(() => useDropSealStates(busy, true));
    renderHook(() => useDropSealStates([kept], true));
    const leaving = renderHook(() => useDropSealStates([left], true));
    await flush();
    leaving.unmount();
    failBatch();
    releaseVerify();
    await flush(60_000);
    const singleReads = mockFetchSignedEvents.mock.calls.map(([id]) => id);
    expect(singleReads).toContain(kept.id);
    expect(singleReads).not.toContain(left.id);
  });

  it("gives a batch read's slot back when its seals left before it could start", async () => {
    const start = Date.now();
    const startedAt = () => mockRequestTimes.map((time) => time - start);
    // A read and a lookup at 100 use this second's two starts.
    renderHook(() => useDropSealStates([aDrop()], true));
    await flush(150);
    expect(startedAt()).toEqual([100, 100]);

    // This seal's read waits for a slot at 1100, but the seal leaves first.
    const leaving = aDrop();
    const { rerender } = renderHook(
      ({ near }) => useDropSealStates([leaving], near),
      { initialProps: { near: true } }
    );
    await flush(150);
    rerender({ near: false });
    await flush(850);
    expect(startedAt()).toEqual([100, 100]);

    // With that slot given back, the next read and lookup both start at once.
    const next = aDrop();
    const { result } = renderHook(() => useDropSealStates([next], true));
    await flush(150);
    expect(startedAt()).toEqual([100, 100, 1250, 1250]);
    expect(result.current).toEqual(["verified"]);
    expect(batchReads().flat()).not.toContain(leaving.id);
  });

  it("reads an author's wallets again once the cached list expires", async () => {
    const author = anAuthor();
    renderHook(() => useDropSealStates([aDrop({ author })], true));
    await flush(5000);
    renderHook(() => useDropSealStates([aDrop({ author })], true));
    await flush(5000);
    expect(mockFetchAuthorWallets).toHaveBeenCalledTimes(1);

    await flush(5 * 60_000);
    renderHook(() => useDropSealStates([aDrop({ author })], true));
    await flush(5000);
    expect(mockFetchAuthorWallets).toHaveBeenCalledTimes(2);
  });

  it("keeps at most 200 authors' wallet lists, forgetting the oldest", async () => {
    const authors = Array.from({ length: 201 }, anAuthor);
    const drops = authors.map((author) => aDrop({ author }));
    renderHook(() => useDropSealStates(drops, true));
    // 201 lookups at two requests per second, plus five reads.
    await flush(110_000);
    expect(mockFetchAuthorWallets).toHaveBeenCalledTimes(201);

    // The newest author's list is still kept, the oldest's was forgotten.
    renderHook(() =>
      useDropSealStates(
        [aDrop({ author: authors[200] }), aDrop({ author: authors[0] })],
        true
      )
    );
    await flush(10_000);
    expect(mockFetchAuthorWallets).toHaveBeenCalledTimes(202);
    expect(mockFetchAuthorWallets.mock.calls.at(-1)?.[0]).toBe(
      authors[0]!.primary_address
    );
  });
});
