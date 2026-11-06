import { act, fireEvent, render, screen } from "@testing-library/react";
import SandboxedExternalIframe from "@/components/common/SandboxedExternalIframe";
import { requestElementFullScreen } from "@/helpers/Helpers";

jest.mock("@/helpers/Helpers", () => {
  const actual = jest.requireActual("@/helpers/Helpers");
  return {
    ...actual,
    requestElementFullScreen: jest.fn(actual.requestElementFullScreen),
  };
});

const requestElementFullScreenMock = requestElementFullScreen as jest.Mock;

jest.mock("@/components/waves/memes/submission/constants/security", () => ({
  canonicalizeInteractiveMediaUrl: (src: string) => src,
}));

let mockIsCapacitor = false;
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: mockIsCapacitor }),
}));

let mockFullScreenSupported = true;
jest.mock("@/hooks/useFullScreenSupported", () => ({
  useFullScreenSupported: () => mockFullScreenSupported,
}));

type ObserverCallback = IntersectionObserverCallback;

let observerCallback: ObserverCallback | null = null;

class MockIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observerCallback = callback;
  }

  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
  takeRecords = jest.fn(() => []);
}

describe("SandboxedExternalIframe", () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;

  beforeEach(() => {
    observerCallback = null;
    mockIsCapacitor = false;
    mockFullScreenSupported = true;
    requestElementFullScreenMock.mockClear();
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  it("retains the isolated artwork sandbox and fullscreen permission", () => {
    const { container } = render(
      <SandboxedExternalIframe
        src="https://example.com/media"
        title="Artwork"
      />
    );
    act(() =>
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        new MockIntersectionObserver(
          jest.fn()
        ) as unknown as IntersectionObserver
      )
    );
    const frame = container.querySelector("iframe");
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    expect(frame).toHaveAttribute("allow", "fullscreen");
    expect(frame).toHaveAttribute("allowfullscreen");
    expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(frame).toHaveAttribute("credentialless", "");
  });

  it("uses the latest onVisible callback when the iframe becomes visible", () => {
    const firstOnVisible = jest.fn();
    const secondOnVisible = jest.fn();
    const { rerender } = render(
      <SandboxedExternalIframe
        src="https://example.com/media"
        title="Media"
        onVisible={firstOnVisible}
      />
    );

    rerender(
      <SandboxedExternalIframe
        src="https://example.com/media"
        title="Media"
        onVisible={secondOnVisible}
      />
    );

    act(() => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        new MockIntersectionObserver(
          jest.fn()
        ) as unknown as IntersectionObserver
      );
    });

    expect(firstOnVisible).not.toHaveBeenCalled();
    expect(secondOnVisible).toHaveBeenCalledTimes(1);
  });

  const revealFrame = () =>
    act(() =>
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        new MockIntersectionObserver(
          jest.fn()
        ) as unknown as IntersectionObserver
      )
    );

  it("shows the source host as text instead of a link that leaves the sandbox", () => {
    render(
      <SandboxedExternalIframe
        src="https://media.example.test/ipfs/cid/index.html"
        title="Artwork"
      />
    );
    revealFrame();

    expect(screen.getByText("media.example.test")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("offers full screen only after the frame is revealed", () => {
    render(
      <SandboxedExternalIframe
        src="https://media.example.test/ipfs/cid/index.html"
        title="Artwork"
        showFullscreenControl
      />
    );

    expect(
      screen.queryByRole("button", { name: "Full screen" })
    ).not.toBeInTheDocument();

    revealFrame();

    expect(
      screen.getByRole("button", { name: "Full screen" })
    ).toBeInTheDocument();
  });

  it("expands this sandboxed frame element itself", async () => {
    const externalRef = { current: null as HTMLIFrameElement | null };
    const { container } = render(
      <SandboxedExternalIframe
        src="https://media.example.test/ipfs/cid/index.html"
        title="Artwork"
        iframeRef={externalRef}
        showFullscreenControl
      />
    );
    revealFrame();
    const frame = container.querySelector("iframe")!;
    const requestFullscreen = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(frame, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Full screen" }));
    });

    expect(externalRef.current).toBe(frame);
    expect(requestElementFullScreenMock).toHaveBeenCalledTimes(1);
    expect(requestElementFullScreenMock).toHaveBeenCalledWith(frame);
    // The real helper reaches the browser API on that same element.
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
  });

  it.each([
    ["the caller has its own control", false, true, false],
    ["full screen is unsupported", true, false, false],
    ["running in the native app", true, true, true],
  ])(
    "omits the full-screen control when %s",
    (_label, showControl, supported, capacitor) => {
      mockFullScreenSupported = supported;
      mockIsCapacitor = capacitor;
      render(
        <SandboxedExternalIframe
          src="https://media.example.test/ipfs/cid/index.html"
          title="Artwork"
          showFullscreenControl={showControl}
        />
      );
      revealFrame();

      expect(
        screen.queryByRole("button", { name: "Full screen" })
      ).not.toBeInTheDocument();
    }
  );
});
