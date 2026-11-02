import { createLazyComponentLoader } from "@/components/utils/lazy-load/createLazyComponentLoader";
import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";

// The interaction helper has its own tests. Here it is replaced by a recorder so
// these tests can fire the first interaction themselves and see how the loader
// uses it, whatever earlier tests did to the real one's shared state.
const mockPreloadOnFirstInteraction = jest.fn();
jest.mock("@/components/utils/lazy-load/preloadOnFirstInteraction", () => ({
  preloadOnFirstInteraction: (task: () => void) =>
    mockPreloadOnFirstInteraction(task),
}));

type GreetingProps = { readonly name: string };

const Greeting = ({ name }: GreetingProps) => (
  <div data-testid="greeting">Hello {name}</div>
);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function setup() {
  const gate = deferred<{ default: typeof Greeting }>();
  const importer = jest.fn(() => gate.promise);
  const loader = createLazyComponentLoader<GreetingProps>(importer);
  // Every committed-or-not render of a probe records what it asked for.
  const frames: string[] = [];

  function Probe({
    enabled = true,
    onError,
  }: {
    readonly enabled?: boolean;
    readonly onError?: () => void;
  }) {
    const isReady = loader.useIsReady({ enabled, onError });
    frames.push(isReady ? "ready" : "pending");
    return isReady ? (
      <loader.Loaded name="6529" />
    ) : (
      <div data-testid="pending" />
    );
  }

  function EarlyProbe({ enabled }: { readonly enabled?: boolean }) {
    loader.usePreloadEarly(enabled);
    return null;
  }

  return {
    importer,
    loader,
    frames,
    Probe,
    EarlyProbe,
    arrive: () => act(async () => gate.resolve({ default: Greeting })),
  };
}

const idleHost = globalThis as unknown as {
  requestIdleCallback?: unknown;
};
const originalRequestIdleCallback = idleHost.requestIdleCallback;

afterEach(() => {
  mockPreloadOnFirstInteraction.mockClear();
  idleHost.requestIdleCallback = originalRequestIdleCallback;
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("createLazyComponentLoader", () => {
  it("shows nothing of the module until it arrives, then the component", async () => {
    const { Probe, importer, arrive } = setup();
    render(<Probe />);

    expect(screen.getByTestId("pending")).toBeInTheDocument();
    expect(importer).toHaveBeenCalledTimes(1);

    await arrive();

    expect(screen.getByTestId("greeting")).toHaveTextContent("Hello 6529");
    expect(screen.queryByTestId("pending")).toBeNull();
  });

  it("renders a cached module in the first pass of a later mount, with no pending frame", async () => {
    const { Probe, importer, frames, arrive } = setup();
    const first = render(<Probe />);
    await arrive();
    first.unmount();
    frames.length = 0;

    render(<Probe />);

    // No awaiting: nothing suspends and nothing waits for an effect, so the
    // very first render already has the component.
    expect(frames).toEqual(["ready"]);
    expect(screen.getByTestId("greeting")).toBeInTheDocument();
    expect(screen.queryByTestId("pending")).toBeNull();
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it("lets an instance that mounted before the chunk arrived render it at once when it is next needed", async () => {
    const { Probe, loader, frames, arrive } = setup();
    const { rerender } = render(<Probe enabled={false} />);
    expect(screen.getByTestId("pending")).toBeInTheDocument();

    loader.preload();
    await arrive();
    // Still pending: this instance is disabled and has not re-rendered.
    expect(screen.getByTestId("pending")).toBeInTheDocument();

    frames.length = 0;
    rerender(<Probe enabled />);

    expect(frames).toEqual(["ready"]);
    expect(screen.getByTestId("greeting")).toBeInTheDocument();
    expect(screen.queryByTestId("pending")).toBeNull();
  });

  it("does not fetch while disabled", () => {
    const { Probe, importer } = setup();
    render(<Probe enabled={false} />);
    expect(importer).not.toHaveBeenCalled();
  });

  it("fetches once however often it is preloaded", () => {
    const { loader, importer } = setup();
    loader.preload();
    loader.preload();
    loader.preload();
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it("starts warming up on the first interaction, and registers once however many instances mount", async () => {
    const requestIdleCallback = jest.fn();
    idleHost.requestIdleCallback = requestIdleCallback;
    const { EarlyProbe, importer, arrive } = setup();

    const first = render(<EarlyProbe />);
    render(<EarlyProbe />);
    first.rerender(<EarlyProbe />);

    expect(mockPreloadOnFirstInteraction).toHaveBeenCalledTimes(1);
    expect(importer).not.toHaveBeenCalled();

    // The visitor interacts: the helper runs the task it was given.
    mockPreloadOnFirstInteraction.mock.calls[0][0]();
    expect(importer).toHaveBeenCalledTimes(1);

    // The idle fallback arriving later changes nothing.
    requestIdleCallback.mock.calls[0][0]();
    expect(importer).toHaveBeenCalledTimes(1);

    await arrive();
    render(<EarlyProbe />);
    expect(mockPreloadOnFirstInteraction).toHaveBeenCalledTimes(1);
  });

  it("still warms up when idle if the visitor has not interacted", () => {
    const requestIdleCallback = jest.fn();
    idleHost.requestIdleCallback = requestIdleCallback;
    const { EarlyProbe, importer } = setup();

    render(<EarlyProbe />);

    expect(requestIdleCallback).toHaveBeenCalledTimes(1);
    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 5000,
    });
    expect(importer).not.toHaveBeenCalled();

    requestIdleCallback.mock.calls[0][0]();
    expect(importer).toHaveBeenCalledTimes(1);

    // An interaction after that finds the chunk already requested.
    mockPreloadOnFirstInteraction.mock.calls[0][0]();
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it("registers nothing until the component has mounted, so nothing runs before hydration", () => {
    const requestIdleCallback = jest.fn();
    idleHost.requestIdleCallback = requestIdleCallback;
    const { EarlyProbe, importer } = setup();

    // A server render never runs effects.
    renderToString(<EarlyProbe />);

    expect(mockPreloadOnFirstInteraction).not.toHaveBeenCalled();
    expect(requestIdleCallback).not.toHaveBeenCalled();
    expect(importer).not.toHaveBeenCalled();

    render(<EarlyProbe />);
    expect(mockPreloadOnFirstInteraction).toHaveBeenCalledTimes(1);
  });

  it("does not warm up while the early preload is disabled", () => {
    const requestIdleCallback = jest.fn();
    idleHost.requestIdleCallback = requestIdleCallback;
    const { EarlyProbe, importer } = setup();

    const { rerender } = render(<EarlyProbe enabled={false} />);
    expect(mockPreloadOnFirstInteraction).not.toHaveBeenCalled();
    expect(requestIdleCallback).not.toHaveBeenCalled();

    rerender(<EarlyProbe enabled />);
    expect(mockPreloadOnFirstInteraction).toHaveBeenCalledTimes(1);
    expect(requestIdleCallback).toHaveBeenCalledTimes(1);
    expect(importer).not.toHaveBeenCalled();
  });

  it("falls back to a timer where requestIdleCallback is missing", () => {
    jest.useFakeTimers();
    idleHost.requestIdleCallback = undefined;
    const { EarlyProbe, importer } = setup();

    render(<EarlyProbe />);
    jest.advanceTimersByTime(2999);
    expect(importer).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(importer).toHaveBeenCalledTimes(1);

    render(<EarlyProbe />);
    jest.advanceTimersByTime(10000);
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it("reports a failed load once and fetches again on the next attempt", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const importer = jest
      .fn()
      .mockRejectedValueOnce(new Error("chunk failed"))
      .mockResolvedValueOnce({ default: Greeting });
    const loader = createLazyComponentLoader<GreetingProps>(importer);
    const onError = jest.fn();
    function Probe() {
      const isReady = loader.useIsReady({ onError });
      return isReady ? (
        <loader.Loaded name="6529" />
      ) : (
        <div data-testid="gone" />
      );
    }

    const first = render(<Probe />);
    await act(async () => undefined);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("gone")).toBeInTheDocument();
    first.unmount();

    render(<Probe />);
    await act(async () => undefined);

    expect(importer).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("greeting")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
