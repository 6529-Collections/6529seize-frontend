import { useScrollToHashOnMount } from "@/hooks/useScrollToHashOnMount";
import { act, render } from "@testing-library/react";
import { StrictMode } from "react";

const TARGET_ID = "late-section";
const HEADING_ID = `${TARGET_ID}-title`;

function Target({
  enabled,
  focusId = HEADING_ID,
}: Readonly<{ enabled?: boolean; focusId?: string | undefined }>) {
  useScrollToHashOnMount(TARGET_ID, { enabled, focusId });
  return (
    <section id={TARGET_ID} aria-labelledby={HEADING_ID}>
      <h2 id={HEADING_ID} tabIndex={-1}>
        Late section
      </h2>
    </section>
  );
}

function HookOnly() {
  useScrollToHashOnMount(TARGET_ID);
  return null;
}

function setHash(hash: string): void {
  globalThis.history.replaceState(null, "", `/profile/subscriptions${hash}`);
}

function setReducedMotion(reduced: boolean): void {
  jest.mocked(globalThis.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: reduced && query === "(prefers-reduced-motion: reduce)",
        media: query,
      }) as MediaQueryList
  );
}

describe("useScrollToHashOnMount", () => {
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrameId = 1;
  let scrollIntoView: jest.Mock;

  function flushFrames(): void {
    act(() => {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(0));
    });
  }

  beforeEach(() => {
    frames.clear();
    nextFrameId = 1;
    scrollIntoView = jest.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });
    jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback) => {
        const id = nextFrameId++;
        frames.set(id, callback);
        return id;
      });
    jest.spyOn(globalThis, "cancelAnimationFrame").mockImplementation((id) => {
      frames.delete(id);
    });
    setReducedMotion(false);
    setHash("");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    setHash("");
  });

  it("scrolls to the target and focuses its heading when the hash matches", () => {
    setHash(`#${TARGET_ID}`);
    const { container } = render(<Target />);

    expect(scrollIntoView).not.toHaveBeenCalled();
    flushFrames();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "smooth",
    });
    expect(scrollIntoView.mock.contexts[0]).toBe(
      container.querySelector(`#${TARGET_ID}`)
    );
    expect(document.activeElement).toBe(document.getElementById(HEADING_ID));
  });

  it("focuses the target itself when no focus element is named", () => {
    setHash(`#${TARGET_ID}`);
    render(
      <section id={TARGET_ID} tabIndex={-1}>
        <HookOnly />
      </section>
    );
    flushFrames();

    expect(document.activeElement).toBe(document.getElementById(TARGET_ID));
  });

  it("does nothing without a matching hash", () => {
    render(<Target />);
    flushFrames();
    setHash("#another-section");
    act(() => {
      globalThis.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(frames.size).toBe(0);
    flushFrames();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
  });

  it("uses instant scrolling when the user prefers reduced motion", () => {
    setReducedMotion(true);
    setHash(`#${TARGET_ID}`);
    render(<Target />);
    flushFrames();

    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "auto",
    });
  });

  it("scrolls once per mount, even across re-renders and StrictMode effects", () => {
    setHash(`#${TARGET_ID}`);
    const { rerender } = render(
      <StrictMode>
        <Target />
      </StrictMode>
    );
    flushFrames();
    rerender(
      <StrictMode>
        <Target />
      </StrictMode>
    );
    flushFrames();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("scrolls when the target mounts after the page has loaded", () => {
    setHash(`#${TARGET_ID}`);
    function Page({ ready }: Readonly<{ ready: boolean }>) {
      return ready ? <Target /> : <p>Loading</p>;
    }
    const { rerender } = render(<Page ready={false} />);
    flushFrames();
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(<Page ready />);
    flushFrames();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(document.getElementById(HEADING_ID));
  });

  it("scrolls again when the hash changes to the target while mounted", () => {
    render(<Target />);
    flushFrames();
    expect(scrollIntoView).not.toHaveBeenCalled();

    setHash(`#${TARGET_ID}`);
    act(() => {
      globalThis.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    flushFrames();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(document.getElementById(HEADING_ID));
  });

  it("collapses repeated hash changes into one scroll", () => {
    setHash(`#${TARGET_ID}`);
    render(<Target />);
    act(() => {
      globalThis.dispatchEvent(new HashChangeEvent("hashchange"));
      globalThis.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    flushFrames();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("stays inert while disabled and scrolls once it is enabled", () => {
    setHash(`#${TARGET_ID}`);
    const { rerender } = render(<Target enabled={false} />);
    flushFrames();
    globalThis.dispatchEvent(new HashChangeEvent("hashchange"));
    flushFrames();

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);

    rerender(<Target enabled />);
    flushFrames();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("drops its pending scroll and listener on unmount", () => {
    setHash(`#${TARGET_ID}`);
    const { unmount } = render(<Target />);
    unmount();
    flushFrames();
    globalThis.dispatchEvent(new HashChangeEvent("hashchange"));
    flushFrames();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("ignores a hash whose target is not in the DOM", () => {
    setHash(`#${TARGET_ID}`);
    function Missing() {
      useScrollToHashOnMount(TARGET_ID);
      return <p>No section here</p>;
    }
    render(<Missing />);

    expect(() => flushFrames()).not.toThrow();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("decodes encoded hashes and tolerates malformed ones", () => {
    const encodedId = "section one";
    function Encoded() {
      useScrollToHashOnMount(encodedId);
      return <section id={encodedId} />;
    }
    setHash("#section%20one");
    const first = render(<Encoded />);
    flushFrames();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    first.unmount();

    setHash("#%E0%A4%A");
    render(<Encoded />);
    expect(() => flushFrames()).not.toThrow();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
