import { act, render } from "@testing-library/react";
import SandboxedExternalIframe from "@/components/common/SandboxedExternalIframe";

jest.mock("@/components/waves/memes/submission/constants/security", () => ({
  canonicalizeInteractiveMediaUrl: (src: string) => src,
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
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
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

  it("uses a caller-provided canonicalizer and forwards iframe options", () => {
    render(
      <SandboxedExternalIframe
        id="media-frame"
        src="https://example.com/media"
        title="Media"
        showBanner={false}
        canonicalizeSrc={() => "https://canonical.example/media"}
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

    const iframe = document.querySelector("iframe");
    expect(iframe).toHaveAttribute("id", "media-frame");
    expect(iframe).toHaveAttribute("src", "https://canonical.example/media");
    expect(iframe).toHaveAttribute(
      "title",
      "Media: https://canonical.example/media"
    );
    expect(iframe).toHaveAttribute("sandbox", "allow-scripts");
    expect(iframe).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(document.body).not.toHaveTextContent(
      "Untrusted interactive content"
    );
  });
});
