import type { SealState } from "@/components/waves/drops/signature/dropSignatureVerdicts";
import type { DropSignatureVerdict } from "@/lib/device-signing/verify-signed-events";

jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => true,
}));

const mockFetchSignedEvents = jest.fn();
const mockFetchBatch = jest.fn();
const mockFetchAuthorWallets = jest.fn();
jest.mock("@/services/api/device-grants-api", () => ({
  fetchDropSignedEvents: (...args: unknown[]) => mockFetchSignedEvents(...args),
  fetchDropsSignedEvents: (...args: unknown[]) => mockFetchBatch(...args),
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

let nextId = 0;
const aDrop = () =>
  ({
    id: `fallback-drop-${(nextId += 1)}`,
    is_author_signed: true,
    title: null,
    parts: [{ content: "gm", media: [], attachments: [], quoted_drop: null }],
    wave: { id: "wave-1" },
    author: { primary_address: AUTHOR },
  }) as any;

const signedEventsFor = (dropId: string) => ({
  drop_id: dropId,
  current_event_id: `0x${"e".repeat(64)}`,
  events: [{ id: `0x${"e".repeat(64)}`, kind: 1 }],
  grants: [],
});

type Store =
  typeof import("@/components/waves/drops/signature/dropSignatureVerdicts");
type ReactModule = typeof import("react");
type ReactDomClient = typeof import("react-dom/client");

interface PageSession {
  readonly store: Store;
  readonly react: ReactModule;
  readonly reactDom: ReactDomClient;
  readonly roots: { unmount: () => void }[];
}

/**
 * A fresh page session: the store, and the React it renders with, loaded
 * anew, so what an earlier test learned about the API does not carry over.
 */
const newPageSession = (): PageSession => {
  let session!: PageSession;
  jest.isolateModules(() => {
    session = {
      store: require("@/components/waves/drops/signature/dropSignatureVerdicts"),
      react: require("react"),
      reactDom: require("react-dom/client"),
      roots: [],
    };
  });
  return session;
};

/** Renders visible seals for the drops; returns their current states. */
const showSeals = (
  { store, react, reactDom, roots }: PageSession,
  drops: readonly ReturnType<typeof aDrop>[]
): (() => readonly SealState[]) => {
  let states: readonly SealState[] = [];
  const Seals = () => {
    states = store.useDropSealStates(drops, true);
    return null;
  };
  const root = reactDom.createRoot(document.createElement("div"));
  react.act(() => root.render(react.createElement(Seals)));
  roots.push(root);
  return () => states;
};

const flush = async ({ react }: PageSession, ms: number) => {
  await react.act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
};

const closeSession = (session: PageSession) => {
  session.roots.forEach((root) => session.react.act(() => root.unmount()));
};

describe("seal checks on an API without the batch read", () => {
  beforeAll(() => {
    // Testing Library is not loaded here, so React is told directly that
    // updates run inside act(), never on the real-time scheduler.
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    // Loading the store once here compiles it (slow on a cold cache)
    // outside the tests' own time limit.
    newPageSession();
  }, 120_000);

  beforeEach(() => {
    jest.useFakeTimers();
    mockFetchSignedEvents
      .mockReset()
      .mockImplementation((dropId: string) =>
        Promise.resolve(signedEventsFor(dropId))
      );
    mockFetchBatch.mockReset();
    mockFetchAuthorWallets.mockReset().mockResolvedValue([AUTHOR]);
    mockVerify.mockReset().mockResolvedValue(signedVerdict);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([404, 405])(
    "reads one drop at a time for the rest of the session after a %s",
    async (status) => {
      mockFetchBatch.mockRejectedValue(
        Object.assign(new Error("Not found"), { status })
      );
      const session = newPageSession();

      const first = [aDrop(), aDrop()];
      const firstStates = showSeals(session, first);
      await flush(session, 10_000);
      expect(firstStates()).toEqual(["verified", "verified"]);
      expect(mockFetchBatch).toHaveBeenCalledTimes(1);
      expect(mockFetchSignedEvents.mock.calls.map(([id]) => id)).toEqual(
        first.map(({ id }) => id)
      );

      // Later checks in the same session never try the batch read again.
      const later = [aDrop(), aDrop(), aDrop()];
      const laterStates = showSeals(session, later);
      await flush(session, 10_000);
      expect(laterStates()).toEqual(Array(3).fill("verified"));
      expect(mockFetchBatch).toHaveBeenCalledTimes(1);
      expect(mockFetchSignedEvents).toHaveBeenCalledTimes(5);
      closeSession(session);
    }
  );

  it("keeps using the batch read after a failure of another kind", async () => {
    mockFetchBatch
      .mockRejectedValueOnce(
        Object.assign(new Error("Bad gateway"), { status: 502 })
      )
      .mockImplementation((dropIds: string[]) =>
        Promise.resolve({
          drops: dropIds.map(signedEventsFor),
          grants: [],
          unavailable: [],
          truncated_drop_ids: [],
        })
      );
    const session = newPageSession();

    // The failed batch's drop is read on its own once.
    const failedStates = showSeals(session, [aDrop()]);
    await flush(session, 10_000);
    expect(failedStates()).toEqual(["verified"]);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(1);

    const nextStates = showSeals(session, [aDrop()]);
    await flush(session, 10_000);
    expect(nextStates()).toEqual(["verified"]);
    expect(mockFetchBatch).toHaveBeenCalledTimes(2);
    expect(mockFetchSignedEvents).toHaveBeenCalledTimes(1);
    closeSession(session);
  });
});
