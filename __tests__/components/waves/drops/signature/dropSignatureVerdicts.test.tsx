import {
  AuthorSignedLabel,
  DropAuthorSignedIndicator,
  WithDropAuthorSignedMarker,
} from "@/components/waves/drops/signature/DropAuthorSignedMarker";
import {
  recordDropSignatureVerdict,
  useDropSealStates,
} from "@/components/waves/drops/signature/dropSignatureVerdicts";
import type { DropSignatureVerdict } from "@/lib/device-signing/verify-signed-events";
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from "@testing-library/react";

jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => true,
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: true }),
}));

jest.mock("@/components/waves/drops/signature/DropSignatureDialog", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock(
  "@/components/waves/drops/signature/DropGroupSignatureDialog",
  () => ({
    __esModule: true,
    default: () => null,
  })
);

const mockFetchSignedEvents = jest.fn();
const mockFetchAuthorWallets = jest.fn();
jest.mock("@/services/api/device-grants-api", () => ({
  fetchDropSignedEvents: (...args: unknown[]) => mockFetchSignedEvents(...args),
  fetchAuthorWallets: (...args: unknown[]) => mockFetchAuthorWallets(...args),
}));

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

// Verdicts live for the page session, so every test uses its own drop ids.
let nextId = 0;
const aDrop = (overrides: Record<string, unknown> = {}) =>
  ({
    id: `drop-${(nextId += 1)}`,
    is_author_signed: true,
    title: null,
    parts: [{ content: "gm", media: [], attachments: [], quoted_drop: null }],
    wave: { id: "wave-1" },
    author: { primary_address: AUTHOR },
    ...overrides,
  }) as any;

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const signedEventsFor = (dropId: string) => ({
  drop_id: dropId,
  current_event_id: `0x${"e".repeat(64)}`,
  events: [{ id: `0x${"e".repeat(64)}`, kind: 1 }],
  grants: [],
});

/** This browser's verdict for a drop, read the way a seal reads it. */
const stateOf = (drop: ReturnType<typeof aDrop>) => {
  const { result, unmount } = renderHook(() =>
    useDropSealStates([drop], false)
  );
  const [state] = result.current;
  unmount();
  return state;
};

/** Lets pending promises and due timers run (fake timers). */
const flush = async (ms = 0) => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
};

/** Requests started so far: signed events plus identity lookups. */
const requestCount = () =>
  mockFetchSignedEvents.mock.calls.length +
  mockFetchAuthorWallets.mock.calls.length;

let nextAuthor = 0;
/** A fresh author, so the identity lookup is not already cached. */
const anAuthor = () => ({
  primary_address: `0x${(nextAuthor += 1).toString(16).padStart(40, "a")}`,
});

const rateLimited = (retryAfter: string | null) =>
  Object.assign(new Error("Too many requests"), {
    status: 429,
    headers: {
      get: (name: string) => (name === "retry-after" ? retryAfter : null),
    },
  });

// The store keeps time-based budgets for the page session: every test
// starts an hour after the previous one, so none inherits another's.
let clock = Date.UTC(2027, 0, 1);

describe("this browser's seal verdicts", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clock += 60 * 60_000;
    jest.setSystemTime(clock);
    mockFetchSignedEvents
      .mockReset()
      .mockImplementation((dropId: string) =>
        Promise.resolve(signedEventsFor(dropId))
      );
    mockFetchAuthorWallets.mockReset().mockResolvedValue([AUTHOR]);
    mockVerify.mockReset().mockResolvedValue(signedVerdict);
  });

  afterEach(async () => {
    // Unmount every seal, then let any request budget or pause run out, so
    // no check is left waiting on a timer of this test.
    cleanup();
    await flush(10 * 60_000);
    clock = Date.now();
    jest.useRealTimers();
  });

  it("never says signed by its author before this browser's own check passed", async () => {
    const verification = deferred<DropSignatureVerdict>();
    mockVerify.mockReturnValue(verification.promise);
    const drop = aDrop();
    render(
      <WithDropAuthorSignedMarker drop={drop}>
        <span>12:30</span>
      </WithDropAuthorSignedMarker>
    );

    expect(
      screen.getByRole("button", { name: "Checking the author's signature" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Signed by its author" })
    ).toBeNull();
    await flush();
    expect(mockVerify).toHaveBeenCalledTimes(1);
    expect(mockFetchSignedEvents).toHaveBeenCalledWith(
      drop.id,
      expect.any(AbortSignal)
    );
    expect(mockVerify).toHaveBeenCalledWith(
      signedEventsFor(drop.id),
      expect.objectContaining({
        expected: {
          dropId: drop.id,
          waveId: "wave-1",
          authorWallets: [AUTHOR],
        },
        displayed: expect.objectContaining({ title: null }),
        grantCheckCache: expect.any(Map),
      })
    );
    expect(mockVerify.mock.calls[0][1]).not.toHaveProperty("contractWallets");
    expect(
      screen.getByRole("button", { name: "Checking the author's signature" })
    ).toBeInTheDocument();

    verification.resolve(signedVerdict);
    await flush();
    expect(
      screen.getByRole("button", { name: "Signed by its author" })
    ).toBeInTheDocument();
  });

  it("renames a single-button card once its static seal's check passes", async () => {
    const drop = aDrop();
    render(
      <button type="button" aria-labelledby="card-label">
        <AuthorSignedLabel id="card-label" drop={drop} label="Open entry" />
        <DropAuthorSignedIndicator drop={drop} />
      </button>
    );
    expect(
      screen.getByRole("button", {
        name: "Open entry, signed, not yet verified",
      })
    ).toBeInTheDocument();
    await flush();
    expect(
      screen.getByRole("button", { name: "Open entry, signed by its author" })
    ).toBeInTheDocument();
  });

  it("reuses a verdict without fetching or verifying again", async () => {
    const drop = aDrop();
    const first = renderHook(() => useDropSealStates([drop], true));
    await flush();
    expect(first.result.current).toEqual(["verified"]);
    first.unmount();

    const second = renderHook(() => useDropSealStates([drop], true));
    expect(second.result.current).toEqual(["verified"]);
    // The same content as a new object (a refetch) is the same verdict.
    expect(stateOf({ ...drop })).toBe("verified");
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(1);
    expect(mockVerify).toHaveBeenCalledTimes(1);
  });

  it("checks again when the content shown changes", async () => {
    const drop = aDrop();
    const { result, rerender } = renderHook(
      ({ shown }) => useDropSealStates([shown], true),
      { initialProps: { shown: drop } }
    );
    await flush();
    expect(result.current).toEqual(["verified"]);

    mockVerify.mockResolvedValue({ status: "invalid" });
    rerender({
      shown: { ...drop, parts: [{ ...drop.parts[0], content: "gn" }] },
    });
    expect(result.current).toEqual(["pending"]);
    await flush(1000);
    expect(result.current).toEqual(["failed"]);
    expect(mockVerify).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["does not verify", { status: "invalid" }, "failed"],
    ["needs a contract-wallet check", { status: "unverifiable" }, "unverified"],
    [
      "was made by a wallet no longer on the author's profile",
      { status: "unverifiable", unlinkedWallet: AUTHOR },
      "unlinked",
    ],
    [
      "comes from an unrecognized origin",
      { status: "unverifiable", unrecognizedOrigin: "evil.example" },
      "unverified",
    ],
    [
      "covers an earlier version only",
      { ...signedVerdict, currentContentSigned: false },
      "unverified",
    ],
  ])(
    "never shows verified when the signature %s",
    async (_name, verdict, state) => {
      mockVerify.mockResolvedValue(verdict);
      const drop = aDrop();
      const { result } = renderHook(() => useDropSealStates([drop], true));
      await flush();
      expect(result.current).toEqual([state]);
    }
  );

  it("shows the failure state on the seal", async () => {
    mockVerify.mockResolvedValue({ status: "invalid" });
    render(
      <WithDropAuthorSignedMarker drop={aDrop()}>
        <span>12:30</span>
      </WithDropAuthorSignedMarker>
    );
    await flush();
    const seal = screen.getByRole("button", {
      name: "The signature doesn't match this post",
    });
    expect(seal.querySelector('[data-seal-state="failed"]')).not.toBeNull();
  });

  it("leaves a check that could not load unverified and never retries it by itself", async () => {
    mockFetchSignedEvents.mockRejectedValue(
      Object.assign(new Error("unavailable"), { status: 503 })
    );
    const drop = aDrop();
    const first = renderHook(() => useDropSealStates([drop], true));
    await flush();
    expect(first.result.current).toEqual(["unverified"]);
    expect(mockVerify).not.toHaveBeenCalled();
    first.unmount();

    // Seen again later in the page session: still unverified, no new request.
    const second = renderHook(() => useDropSealStates([drop], true));
    await flush(60 * 60_000);
    expect(second.result.current).toEqual(["unverified"]);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(1);
  });

  it("leaves a timed-out check unverified and never retries it by itself", async () => {
    mockFetchSignedEvents.mockImplementation(
      (_dropId: string, signal: AbortSignal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );
    const drop = aDrop();
    const { result, unmount } = renderHook(() =>
      useDropSealStates([drop], true)
    );
    await flush(19_000);
    expect(result.current).toEqual(["pending"]);
    await flush(1000);
    expect(result.current).toEqual(["unverified"]);
    unmount();

    renderHook(() => useDropSealStates([drop], true));
    await flush(60 * 60_000);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(1);
  });

  it("gives the shared identity lookup its own timeout", async () => {
    const author = anAuthor();
    const first = aDrop({ author });
    const second = aDrop({ author });
    const lookup = deferred<string[]>();
    mockFetchAuthorWallets.mockReturnValue(lookup.promise);
    const { result } = renderHook(() =>
      useDropSealStates([first, second], true)
    );
    // Two signed-event reads use this second's budget; the lookup waits.
    await flush(1000);
    expect(mockFetchAuthorWallets).toHaveBeenCalledTimes(1);
    const [, signal] = mockFetchAuthorWallets.mock.calls[0] as [
      string,
      AbortSignal,
    ];
    // Not either check's signal: neither check's request owns it.
    const checkSignals = mockFetchSignedEvents.mock.calls.map(
      ([, checkSignal]) => checkSignal
    );
    expect(checkSignals).not.toContain(signal);
    lookup.resolve([AUTHOR]);
    await flush();
    expect(result.current).toEqual(["verified", "verified"]);
  });

  it("drops queued checks whose seals unmount, so scrolling builds no backlog", async () => {
    const pending = Array.from({ length: 2 }, () =>
      deferred<DropSignatureVerdict>()
    );
    pending.forEach((item) => mockVerify.mockReturnValueOnce(item.promise));
    const drops = Array.from({ length: 6 }, () => aDrop());
    const hooks = drops.map((drop) =>
      renderHook(() => useDropSealStates([drop], true))
    );
    await flush(5000);
    expect(mockVerify).toHaveBeenCalledTimes(2);

    // The last four seals scroll away before their checks start.
    hooks.slice(2).forEach((hook) => hook.unmount());
    pending.forEach((item) => item.resolve(signedVerdict));
    await flush(60_000);
    expect(hooks[0]!.result.current).toEqual(["verified"]);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(2);
    expect(mockVerify).toHaveBeenCalledTimes(2);
    expect(stateOf(drops[4])).toBe("pending");

    // Shown again, a dropped check is queued again.
    const again = renderHook(() => useDropSealStates([drops[4]], true));
    await flush(1000);
    expect(again.result.current).toEqual(["verified"]);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(3);
  });

  it("drops a queued check when its seal leaves the viewport", async () => {
    const pending = Array.from({ length: 2 }, () =>
      deferred<DropSignatureVerdict>()
    );
    pending.forEach((item) => mockVerify.mockReturnValueOnce(item.promise));
    const busy = Array.from({ length: 2 }, () => aDrop());
    busy.forEach((drop) => renderHook(() => useDropSealStates([drop], true)));
    await flush(2000);
    expect(mockVerify).toHaveBeenCalledTimes(2);

    const drop = aDrop();
    const { rerender } = renderHook(
      ({ near }) => useDropSealStates([drop], near),
      { initialProps: { near: true } }
    );
    rerender({ near: false });
    pending.forEach((item) => item.resolve(signedVerdict));
    await flush(60_000);
    expect(stateOf(busy[1])).toBe("verified");
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(2);
    expect(mockFetchSignedEvents).not.toHaveBeenCalledWith(
      drop.id,
      expect.anything()
    );
  });

  it("never runs two identical checks at once", async () => {
    const verification = deferred<DropSignatureVerdict>();
    mockVerify.mockReturnValue(verification.promise);
    const drop = aDrop();
    const first = renderHook(() => useDropSealStates([drop], true));
    const second = renderHook(() => useDropSealStates([{ ...drop }], true));
    await flush();
    expect(mockVerify).toHaveBeenCalledTimes(1);
    verification.resolve(signedVerdict);
    await flush();
    expect(first.result.current).toEqual(["verified"]);
    expect(second.result.current).toEqual(["verified"]);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(1);
  });

  it("checks nothing until the seal is seen, nor drops 6529.io marks unsigned", async () => {
    const drop = aDrop();
    const unsigned = aDrop({ is_author_signed: false });
    const { result, rerender } = renderHook(
      ({ active }) => useDropSealStates([drop, unsigned], active),
      { initialProps: { active: false } }
    );
    await flush(5000);
    expect(result.current).toEqual(["pending", "pending"]);
    expect(mockFetchSignedEvents).not.toHaveBeenCalled();

    rerender({ active: true });
    await flush(5000);
    expect(result.current[0]).toBe("verified");
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(1);
    expect(mockFetchSignedEvents).toHaveBeenCalledWith(
      drop.id,
      expect.any(AbortSignal)
    );
  });

  it("runs at most two checks at once and the rest in order", async () => {
    const pending = Array.from({ length: 4 }, () =>
      deferred<DropSignatureVerdict>()
    );
    pending.forEach((item) => mockVerify.mockReturnValueOnce(item.promise));
    const author = anAuthor();
    const drops = Array.from({ length: 4 }, () => aDrop({ author }));
    const { result } = renderHook(() => useDropSealStates(drops, true));
    await flush(10_000);
    expect(mockVerify).toHaveBeenCalledTimes(2);
    expect(mockFetchSignedEvents.mock.calls.map(([id]) => id)).toEqual([
      drops[0].id,
      drops[1].id,
    ]);

    pending[0]!.resolve(signedVerdict);
    await flush(1000);
    expect(mockVerify).toHaveBeenCalledTimes(3);
    pending.slice(1).forEach((item) => item.resolve(signedVerdict));
    await flush(10_000);
    expect(result.current).toEqual(Array(4).fill("verified"));
    // One author: one identity lookup.
    expect(mockFetchAuthorWallets).toHaveBeenCalledTimes(1);
  });

  it("starts at most two requests per second, identity lookups included", async () => {
    const author = anAuthor();
    const drops = Array.from({ length: 6 }, () => aDrop({ author }));
    const { result } = renderHook(() => useDropSealStates(drops, true));
    await flush();
    expect(requestCount()).toBe(2);
    await flush(999);
    expect(requestCount()).toBe(2);
    await flush(1);
    expect(requestCount()).toBe(4);
    await flush(1000);
    expect(requestCount()).toBe(6);
    await flush(10_000);
    // Six signed-event reads and one identity lookup.
    expect(requestCount()).toBe(7);
    expect(result.current).toEqual(Array(6).fill("verified"));
  });

  it("takes the Signature dialog's verdict, such as a contract wallet checked on Ethereum", () => {
    const drop = aDrop();
    const { result } = renderHook(() => useDropSealStates([drop], false));
    expect(result.current).toEqual(["pending"]);

    act(() => recordDropSignatureVerdict(drop.id, drop, signedVerdict));
    expect(result.current).toEqual(["verified"]);
  });

  it("keeps the verdict of a seal on screen when older verdicts are forgotten", () => {
    const shown = aDrop();
    const { result } = renderHook(() => useDropSealStates([shown], false));
    act(() => recordDropSignatureVerdict(shown.id, shown, signedVerdict));
    const others = Array.from({ length: 600 }, () => aDrop());
    act(() => {
      others.forEach((drop) =>
        recordDropSignatureVerdict(drop.id, drop, signedVerdict)
      );
    });
    expect(result.current).toEqual(["verified"]);
    // Verdicts no seal shows are forgotten, oldest first.
    expect(stateOf(others[0])).toBe("pending");
    expect(stateOf(others[599])).toBe("verified");
  });

  it.each([
    ["for its Retry-After", "7", 7000],
    ["for at least 5 seconds", "1", 5000],
    ["for 5 seconds without a Retry-After", null, 5000],
  ])(
    "pauses every check after a 429 %s, leaving the seal pending",
    async (_name, retryAfter, pauseMs) => {
      const drop = aDrop();
      const other = aDrop();
      mockFetchSignedEvents.mockRejectedValueOnce(rateLimited(retryAfter));
      const { result } = renderHook(() =>
        useDropSealStates([drop, other], true)
      );
      await flush();
      // The other check had already started; the 429 pauses what follows.
      const startedBeforePause = mockFetchSignedEvents.mock.calls.length;
      expect(result.current[0]).toBe("pending");

      await flush(pauseMs - 1);
      expect(mockFetchSignedEvents).toHaveBeenCalledTimes(startedBeforePause);
      expect(result.current[0]).toBe("pending");

      await flush(1);
      await flush();
      expect(mockFetchSignedEvents.mock.calls.length).toBeGreaterThan(
        startedBeforePause
      );
      await flush(5000);
      expect(result.current).toEqual(["verified", "verified"]);
    }
  );
});
