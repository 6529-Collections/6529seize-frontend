/**
 * Test-only bridge for suites that mock `@/contexts/wave/MyStreamContext`.
 *
 * The open wave has its own context (`ActiveWaveContext`), and per-row
 * actions read the wave lists through the stable actions value. Suites that
 * drive the stream through a mocked `useMyStream` / `useMyStreamOptional`
 * can route those reads to the same mocked value:
 *
 *   jest.mock("@/contexts/wave/ActiveWaveContext", () =>
 *     jest.requireActual("@/__tests__/utils/streamContextBridgeMock")
 *       .activeWaveContextMock
 *   );
 */
type MockedStream = {
  readonly activeWave?: unknown;
  readonly waves?: unknown;
  readonly directMessages?: unknown;
} & Record<string, unknown>;

type MockedStreamModule = {
  readonly useMyStreamOptional?: () => MockedStream | null | undefined;
  readonly useMyStream?: () => MockedStream | null | undefined;
};

export const currentMockedStream = (): MockedStream | null => {
  const mocked = jest.requireMock(
    "@/contexts/wave/MyStreamContext"
  ) as MockedStreamModule;
  return mocked.useMyStreamOptional?.() ?? mocked.useMyStream?.() ?? null;
};

export const activeWaveContextMock = {
  ActiveWaveProvider: ({ children }: { readonly children: unknown }) =>
    children,
  useActiveWave: () => currentMockedStream()?.activeWave,
  useActiveWaveOptional: () => currentMockedStream()?.activeWave ?? null,
};

const streamLists = () => {
  const stream = currentMockedStream();
  return stream
    ? { waves: stream.waves, directMessages: stream.directMessages }
    : null;
};

/** `useMyStreamActions` shaped from the mocked stream value. */
export const mockedStreamActions = () => {
  const stream = currentMockedStream();
  return stream
    ? {
        ...stream,
        streamLists: { get: streamLists, subscribe: () => () => {} },
      }
    : null;
};

/** `useMyStreamSelector` applied to the mocked stream value. */
export const mockedStreamSelector = <T>(
  selector: (lists: ReturnType<typeof streamLists>) => T
): T => selector(streamLists());
