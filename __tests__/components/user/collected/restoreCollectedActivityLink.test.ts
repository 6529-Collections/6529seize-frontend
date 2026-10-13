import { restoreCollectedActivityLink } from "@/components/user/collected/restoreCollectedActivityLink";

describe("Collected activity return restoration", () => {
  const originalIntersection = Object.getOwnPropertyDescriptor(
    globalThis,
    "IntersectionObserver"
  );
  const originalResize = Object.getOwnPropertyDescriptor(
    globalThis,
    "ResizeObserver"
  );
  const originalScroll = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "scrollIntoView"
  );
  let link: HTMLAnchorElement;
  let bounds: DOMRect;
  let intersectionCallback: IntersectionObserverCallback;
  let resizeCallback: ResizeObserverCallback;
  const intersectionObserver = {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: () => [],
    root: null,
    rootMargin: "0px",
    thresholds: [0, 0.01],
  };
  const resizeObserver = {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  };
  const scroll = jest.fn();

  const intersect = (visible: boolean) =>
    intersectionCallback(
      [
        {
          target: link,
          isIntersecting: visible,
          intersectionRatio: visible ? 1 : 0,
          time: 0,
          boundingClientRect: bounds,
          intersectionRect: bounds,
          rootBounds: null,
        },
      ],
      intersectionObserver
    );
  const resize = () => resizeCallback([], resizeObserver);
  const nextFrame = () => jest.advanceTimersByTime(20);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    Object.defineProperty(globalThis, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: jest.fn((callback: IntersectionObserverCallback) => {
        intersectionCallback = callback;
        return intersectionObserver;
      }),
    });
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      writable: true,
      value: jest.fn((callback: ResizeObserverCallback) => {
        resizeCallback = callback;
        return resizeObserver;
      }),
    });
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      writable: true,
      value: scroll,
    });
    document.body.innerHTML =
      '<section><div><a id="collected-activity-distribution-42" href="/the-memes/42">Artwork</a><button>Other control</button></div></section>';
    link = document.querySelector<HTMLAnchorElement>("a")!;
    bounds = new DOMRect(100, 100, 70, 20);
    jest.spyOn(link, "getBoundingClientRect").mockImplementation(() => bounds);
    globalThis.history.replaceState(null, "", `/Shelby/collected#${link.id}`);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    for (const [owner, name, descriptor] of [
      [globalThis, "IntersectionObserver", originalIntersection],
      [globalThis, "ResizeObserver", originalResize],
      [Element.prototype, "scrollIntoView", originalScroll],
    ] as const) {
      if (descriptor) Object.defineProperty(owner, name, descriptor);
      else Reflect.deleteProperty(owner, name);
    }
    document.body.innerHTML = "";
    globalThis.history.replaceState(null, "", "/");
  });

  it("only restores the row named by the URL", () => {
    globalThis.history.replaceState(null, "", "/Shelby/collected#different");
    expect(restoreCollectedActivityLink(link)).toBeUndefined();
    expect(link).not.toHaveFocus();
    expect(scroll).not.toHaveBeenCalled();
    expect(intersectionObserver.observe).not.toHaveBeenCalled();
  });

  it("restores focus and corrects a later browser scroll displacement", () => {
    const cleanup = restoreCollectedActivityLink(link);
    expect(link).toHaveFocus();
    expect(scroll).toHaveBeenCalledWith({
      behavior: "instant",
      block: "center",
      inline: "nearest",
    });
    intersect(true);
    nextFrame();
    expect(scroll).toHaveBeenCalledTimes(1);
    intersect(false);
    nextFrame();
    expect(scroll).toHaveBeenCalledTimes(2);
    cleanup?.();
  });

  it("corrects clipping while Details grows and stops correcting once visible", () => {
    const cleanup = restoreCollectedActivityLink(link);
    intersect(false);
    resize();
    resize();
    nextFrame();
    expect(scroll).toHaveBeenCalledTimes(2);
    resize();
    nextFrame();
    expect(scroll).toHaveBeenCalledTimes(3);
    intersect(true);
    resize();
    nextFrame();
    expect(scroll).toHaveBeenCalledTimes(3);
    expect(resizeObserver.observe).toHaveBeenCalledWith(link.parentElement);
    expect(resizeObserver.observe).toHaveBeenCalledWith(
      document.documentElement
    );
    cleanup?.();
  });

  it("corrects a layout shift before the intersection observer catches up", () => {
    const cleanup = restoreCollectedActivityLink(link);
    intersect(true);
    nextFrame();
    bounds = new DOMRect(100, 2000, 70, 20);
    resize();
    nextFrame();
    expect(scroll).toHaveBeenCalledTimes(2);
    cleanup?.();
  });

  it.each(["wheel", "pointerdown", "touchstart", "keydown"])(
    "yields immediately to user %s input",
    (event) => {
      restoreCollectedActivityLink(link);
      intersect(false);
      globalThis.dispatchEvent(new Event(event));
      resize();
      nextFrame();
      expect(scroll).toHaveBeenCalledTimes(1);
      expect(intersectionObserver.disconnect).toHaveBeenCalledTimes(1);
      expect(resizeObserver.disconnect).toHaveBeenCalledTimes(1);
    }
  );

  it("does not steal focus after the user moves to another control", () => {
    restoreCollectedActivityLink(link);
    document.querySelector<HTMLButtonElement>("button")!.focus();
    intersect(false);
    resize();
    nextFrame();
    expect(link).not.toHaveFocus();
    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it.each(["hashchange", "popstate"])("stops on %s navigation", (event) => {
    restoreCollectedActivityLink(link);
    globalThis.dispatchEvent(new Event(event));
    intersect(false);
    nextFrame();
    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it("bounds the restoration window even when the row stays clipped", () => {
    restoreCollectedActivityLink(link);
    intersect(true);
    nextFrame();
    jest.advanceTimersByTime(2000);
    intersect(false);
    resize();
    nextFrame();
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
    expect(resizeObserver.disconnect).toHaveBeenCalledTimes(1);
  });

  it("cancels pending work and removes listeners on unmount", () => {
    const cleanup = restoreCollectedActivityLink(link);
    intersect(false);
    cleanup?.();
    cleanup?.();
    resize();
    nextFrame();
    globalThis.dispatchEvent(new Event("wheel"));
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(intersectionObserver.disconnect).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each(["row", "URL"])("stops if the returned %s disappears", (removed) => {
    restoreCollectedActivityLink(link);
    if (removed === "row") link.remove();
    else globalThis.history.replaceState(null, "", "/Shelby/collected");
    resize();
    nextFrame();
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(resizeObserver.disconnect).toHaveBeenCalledTimes(1);
  });

  it("still restores without observer APIs", () => {
    Reflect.deleteProperty(globalThis, "IntersectionObserver");
    Reflect.deleteProperty(globalThis, "ResizeObserver");
    const cleanup = restoreCollectedActivityLink(link);
    nextFrame();
    expect(link).toHaveFocus();
    expect(scroll).toHaveBeenCalledTimes(1);
    cleanup?.();
  });
});
