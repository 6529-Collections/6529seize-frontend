import { createNavigationScrollRestoration } from "@/helpers/navigation-scroll-restoration";

describe("navigation scroll restoration", () => {
  let top = 0;
  let disconnect = () => {};
  let restoration: ReturnType<typeof createNavigationScrollRestoration>;

  beforeEach(() => {
    jest.useFakeTimers();
    top = 0;
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => top,
    });
    jest.spyOn(window, "scrollTo").mockImplementation(() => {});
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 5000,
    });
    window.history.replaceState(null, "", "/network?page=2");
    restoration = createNavigationScrollRestoration();
    disconnect = restoration.listen();
  });

  afterEach(() => {
    disconnect();
    jest.restoreAllMocks();
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 0,
    });
    jest.useRealTimers();
    Reflect.deleteProperty(document.documentElement, "scrollHeight");
    window.history.replaceState(null, "", "/");
  });

  function rememberAndLeave() {
    top = 900;
    document.dispatchEvent(new Event("scroll"));
    window.history.replaceState(null, "", "/Shelby");
    top = 0;
  }

  function clickLink(href: string, init: MouseEventInit = {}) {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.addEventListener("click", (event) => event.preventDefault());
    document.body.append(anchor);
    anchor.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
        ...init,
      })
    );
    anchor.remove();
  }

  it.each(["/Shelby", "/canonical-profile"])(
    "starts a native profile at the top and retains its list origin (%s)",
    (destination) => {
      disconnect();
      restoration = createNavigationScrollRestoration({ isNative: () => true });
      disconnect = restoration.listen();
      top = 900;
      clickLink("/Shelby");
      expect(window.scrollTo).not.toHaveBeenCalled();
      window.history.replaceState(null, "", destination);
      restoration.committed(destination);
      jest.advanceTimersByTime(20);
      expect(window.scrollTo).toHaveBeenLastCalledWith({
        top: 0,
        behavior: "instant",
      });
      top = 0;
      restoration.prepare("/network?page=2");
      window.history.replaceState(null, "", "/network?page=2");
      restoration.committed("/network?page=2");
      jest.advanceTimersByTime(20);
      expect(window.scrollTo).toHaveBeenLastCalledWith({
        top: 900,
        behavior: "instant",
      });
    }
  );

  it.each([
    ["/Shelby", { ctrlKey: true }],
    ["/Shelby", { metaKey: true }],
    ["/Shelby#details", {}],
    ["https://example.com/Shelby", {}],
    ["/waves/wave", {}],
    ["/network?page=3", {}],
  ])(
    "does not reset modified, anchored, external or section-owned navigation (%s)",
    (href, init) => {
      disconnect();
      restoration = createNavigationScrollRestoration({ isNative: () => true });
      disconnect = restoration.listen();
      clickLink(href, init);
      expect(jest.getTimerCount()).toBe(0);
    }
  );

  it("preserves ordinary web link scroll behavior", () => {
    clickLink("/Shelby");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("does not override browser Back when a forward link was interrupted", () => {
    disconnect();
    restoration = createNavigationScrollRestoration({ isNative: () => true });
    disconnect = restoration.listen();
    clickLink("/Shelby");
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.history.replaceState(null, "", "/discover");
    restoration.committed("/discover");
    jest.advanceTimersByTime(20);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("restores an ordinary page after its route commits", () => {
    rememberAndLeave();
    expect(restoration.prepare("/network?page=2")).toBe(true);
    expect(window.scrollTo).not.toHaveBeenCalled();
    window.history.replaceState(null, "", "/network?page=2");
    restoration.committed("/network?page=2");
    jest.advanceTimersByTime(20);
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 900,
      behavior: "instant",
    });
  });

  it("keeps a slow Back eligible and retries when existing content grows", () => {
    rememberAndLeave();
    restoration.prepare("/network?page=2");
    jest.advanceTimersByTime(3000);
    window.history.replaceState(null, "", "/network?page=2");
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: window.innerHeight + 300,
    });
    restoration.committed("/network?page=2");
    jest.advanceTimersByTime(40);
    expect(window.scrollTo).not.toHaveBeenCalled();
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 5000,
    });
    jest.advanceTimersByTime(40);
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 900,
      behavior: "instant",
    });
    expect(jest.getTimerCount()).toBe(0);
  });

  it("uses the same query encoding for scroll capture, lookup and commit", () => {
    window.history.replaceState(null, "", "/network?name=two%20words");
    rememberAndLeave();
    expect(restoration.prepare("/network?name=two+words")).toBe(true);
    window.history.replaceState(null, "", "/network?name=two%20words");
    restoration.committed("/network?name=two+words");
    jest.advanceTimersByTime(20);
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 900,
      behavior: "instant",
    });
  });

  it("replaces an older offset when a fresh web visit leaves without scrolling", () => {
    rememberAndLeave();
    window.history.replaceState(null, "", "/network?page=2");
    top = 0;
    clickLink("/Shelby");
    window.history.replaceState(null, "", "/Shelby");
    expect(restoration.prepare("/network?page=2")).toBe(true);
    window.history.replaceState(null, "", "/network?page=2");
    top = 200;
    restoration.committed("/network?page=2");
    jest.advanceTimersByTime(20);
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "instant",
    });
  });

  it("does not restore another sort, an explicit anchor or a virtualized stream", () => {
    rememberAndLeave();
    expect(restoration.prepare("/network?page=1")).toBe(false);
    expect(restoration.prepare("/network?page=2#member")).toBe(false);
    expect(restoration.prepare("/waves?view=profile-feed")).toBe(false);
  });

  it("stops restoration when the user starts interacting", () => {
    rememberAndLeave();
    restoration.prepare("/network?page=2");
    window.history.replaceState(null, "", "/network?page=2");
    restoration.committed("/network?page=2");
    document.dispatchEvent(new Event("touchstart"));
    jest.advanceTimersByTime(2000);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("releases a failed or interrupted return without keeping idle work alive", () => {
    rememberAndLeave();
    restoration.prepare("/network?page=2");
    restoration.committed("/discover");
    jest.advanceTimersByTime(2000);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
