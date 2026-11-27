import {
  commitWaveNavigationTransition,
  commitWaveNavigationContent,
  navigateAfterWaveSwipe,
  consumeWaveSwipeHandoff,
  runWaveNavigationTransition,
  runPhoneChevronBackTransition,
  runPhoneConversationEntryTransition,
  skipWaveNavigationTransition,
} from "@/helpers/waves/wave-navigation-transition";

jest.mock("@capacitor/core", () => {
  const actual =
    jest.requireActual<typeof import("@capacitor/core")>("@capacitor/core");
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, getPlatform: () => "ios" },
  };
});

const originalStart = document.startViewTransition;
const originalMatchMedia = window.matchMedia;
const originalWidth = window.innerWidth;
const media = {
  matches: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};
let finish: () => void;
let updateDone: Promise<void>;
const skip = jest.fn(() => finish());
const start = jest.fn((update: () => Promise<void>) => {
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  updateDone = Promise.resolve().then(update);
  return { ready: updateDone, finished, skipTransition: skip };
});

it("keeps the list in the root capture and names only the incoming phone conversation", async () => {
  window.matchMedia = jest.fn(
    (query: string): MediaQueryList => ({
      matches: query === "(width < 768px)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: media.addEventListener,
      removeEventListener: media.removeEventListener,
      dispatchEvent: jest.fn(() => true),
    })
  );
  document.body.innerHTML = "<div data-wave-swipe-page></div>";
  const list = document.querySelector<HTMLElement>("[data-wave-swipe-page]")!;
  const navigate = jest.fn();
  runPhoneConversationEntryTransition("/messages/abc", navigate);
  expect(list.style.viewTransitionName).toBe("");
  expect(document.documentElement.dataset["waveNavigationTransition"]).toBe(
    "conversation-entry"
  );
  await Promise.resolve();
  expect(navigate).toHaveBeenCalledTimes(1);
  document.body.innerHTML = "<div data-wave-swipe-page></div>";
  const conversation = document.querySelector<HTMLElement>(
    "[data-wave-swipe-page]"
  )!;
  expect(commitWaveNavigationTransition(null, "/messages/abc")).toBe(true);
  expect(conversation.style.viewTransitionName).toBe("wave-navigation");
  await updateDone;
  finish();
  await Promise.resolve();
  expect(conversation.style.viewTransitionName).toBe("");
});

beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 412,
  });
  jest.clearAllMocks();
  document.body.innerHTML = '<div data-wave-navigation-screen="list"></div>';
  media.matches = false;
  window.matchMedia = jest.fn().mockReturnValue(media);
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: start,
  });
});

afterEach(async () => {
  skipWaveNavigationTransition();
  await Promise.resolve();
  jest.useRealTimers();
  window.matchMedia = originalMatchMedia;
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: originalWidth,
  });
  Object.defineProperty(document, "startViewTransition", {
    value: originalStart,
  });
  document.body.innerHTML = "";
});

it("captures the old screen before navigating and releases after the new screen commits", async () => {
  const navigate = jest.fn();
  runWaveNavigationTransition("wave", navigate);
  expect(navigate).not.toHaveBeenCalled();
  expect(document.documentElement.dataset["waveNavigationTransition"]).toBe(
    "wave-entry"
  );
  await Promise.resolve();
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(commitWaveNavigationTransition("wave")).toBe(true);
  await updateDone;
  jest.advanceTimersByTime(500);
  expect(skip).not.toHaveBeenCalled();
  finish();
  await Promise.resolve();
  expect(
    document.documentElement.dataset["waveNavigationTransition"]
  ).toBeUndefined();
  expect(
    document.querySelector<HTMLElement>("[data-wave-navigation-screen]")?.style
      .viewTransitionName
  ).toBe("");
});

it("uses the reduced-motion crossfade and keeps navigation immediate without browser support", async () => {
  const navigate = jest.fn();
  media.matches = true;
  runWaveNavigationTransition("wave", navigate);
  await Promise.resolve();
  expect(start).toHaveBeenCalledTimes(1);
  commitWaveNavigationTransition("wave");
  await updateDone;
  finish();
  await Promise.resolve();
  media.matches = false;
  Object.defineProperty(document, "startViewTransition", { value: undefined });
  runWaveNavigationTransition("wave", navigate);
  expect(navigate).toHaveBeenCalledTimes(2);
  expect(start).toHaveBeenCalledTimes(1);
});

it("clears pending Feed content when a Waves return takes ownership", async () => {
  runWaveNavigationTransition("feed", jest.fn());
  await Promise.resolve();
  commitWaveNavigationTransition("feed");
  await updateDone;
  document.body.innerHTML = '<div data-wave-navigation-screen="feed"></div>';
  const navigate = jest.fn();
  runWaveNavigationTransition("list", navigate);
  expect(document.documentElement).not.toHaveAttribute(
    "data-wave-navigation-content-pending"
  );
  await Promise.resolve();
  commitWaveNavigationTransition("list");
  await updateDone;
  expect(navigate).toHaveBeenCalledTimes(1);
  finish();
  await Promise.resolve();
});

it.each(["motion", "deadline"])(
  "keeps navigation when %s cancels motion before the capture callback",
  async (reason) => {
    const navigate = jest.fn();
    runWaveNavigationTransition("wave", navigate);
    if (reason === "motion") media.addEventListener.mock.calls[0]?.[1]();
    else jest.advanceTimersByTime(500);
    await updateDone;
    expect(navigate).toHaveBeenCalledTimes(1);
  }
);

it("does not run a superseded capture callback", async () => {
  const navigate = jest.fn();
  runWaveNavigationTransition("wave", navigate);
  skipWaveNavigationTransition();
  await updateDone;
  expect(navigate).not.toHaveBeenCalled();
});

it("lets a same-screen selection supersede a pending Feed capture", async () => {
  document.body.innerHTML = '<div data-wave-navigation-screen="wave"></div>';
  const oldNavigation = jest.fn();
  const selection = jest.fn();
  runWaveNavigationTransition("feed", oldNavigation);
  runWaveNavigationTransition("wave", selection);
  await updateDone;
  expect(selection).toHaveBeenCalledTimes(1);
  expect(oldNavigation).not.toHaveBeenCalled();
});

it("drops the pending swipe handoff when its navigation is superseded", () => {
  navigateAfterWaveSwipe(skipWaveNavigationTransition);
  expect(consumeWaveSwipeHandoff()).toBe(false);
});

it("does not capture unrelated layouts or same-screen navigation", () => {
  const navigate = jest.fn();
  runWaveNavigationTransition("list", navigate);
  document.body.innerHTML = "";
  runWaveNavigationTransition("wave", navigate);
  expect(navigate).toHaveBeenCalledTimes(2);
  expect(start).not.toHaveBeenCalled();
});

it("releases an interrupted transition without waiting indefinitely", async () => {
  const navigate = jest.fn();
  runWaveNavigationTransition("wave", navigate);
  await Promise.resolve();
  jest.advanceTimersByTime(500);
  await updateDone;
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(skip).toHaveBeenCalledTimes(1);
  expect(
    document.documentElement.dataset["waveNavigationTransition"]
  ).toBeUndefined();
});

it("skips an in-flight transition when motion preferences change", async () => {
  runWaveNavigationTransition("wave", jest.fn());
  await Promise.resolve();
  media.addEventListener.mock.calls[0]?.[1]();
  await updateDone;
  expect(skip).toHaveBeenCalledTimes(1);
  expect(
    document.documentElement.dataset["waveNavigationTransition"]
  ).toBeUndefined();
});

it("falls back to navigation and restores the surface when transition startup throws", () => {
  start.mockImplementationOnce(() => {
    throw new Error("Transition unavailable");
  });
  const navigate = jest.fn();
  expect(() => runWaveNavigationTransition("wave", navigate)).not.toThrow();
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(commitWaveNavigationTransition("wave")).toBe(false);
  expect(
    document.documentElement.dataset["waveNavigationTransition"]
  ).toBeUndefined();
  expect(
    document.documentElement.style.getPropertyValue("--wave-transition-height")
  ).toBe("");
  expect(
    document.querySelector<HTMLElement>("[data-wave-navigation-screen]")?.style
      .viewTransitionName
  ).toBe("");
});

it("cancels only once across repeated interruption and motion preference events", async () => {
  runWaveNavigationTransition("wave", jest.fn());
  await Promise.resolve();
  const preferenceChanged = media.addEventListener.mock.calls[0]?.[1];
  skipWaveNavigationTransition();
  skipWaveNavigationTransition();
  preferenceChanged();
  await updateDone;
  jest.advanceTimersByTime(500);
  preferenceChanged();
  expect(skip).toHaveBeenCalledTimes(1);
  expect(commitWaveNavigationTransition("wave")).toBe(false);
});

it("hands an already animated swipe directly to navigation without a second transition", () => {
  const navigate = jest.fn();
  document.body.innerHTML = '<div data-wave-navigation-screen="wave"></div>';
  navigateAfterWaveSwipe(() => runWaveNavigationTransition("list", navigate));
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(start).not.toHaveBeenCalled();
  expect(consumeWaveSwipeHandoff()).toBe(true);
  expect(consumeWaveSwipeHandoff()).toBe(false);
});

it("captures a released swipe before navigation and reveals the destination during its settle", async () => {
  document.body.innerHTML =
    '<div data-wave-navigation-screen="wave"><div id="swipe"></div></div>';
  const surface = document.getElementById("swipe")!;
  surface.style.transform = "translate3d(140px, 0, 0)";
  const navigate = jest.fn(() =>
    runWaveNavigationTransition("feed", jest.fn())
  );
  expect(
    runWaveNavigationTransition("feed", navigate, {
      surface,
      distance: 140,
      width: 400,
    })
  ).toBe(true);
  expect(surface.style.transform).not.toBe("");
  expect(navigate).not.toHaveBeenCalled();
  expect(document.documentElement.dataset["waveNavigationTransition"]).toBe(
    "swipe-back"
  );
  await Promise.resolve();
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(start).toHaveBeenCalledTimes(1);
  expect(surface.style.transform).toBe("");
  let ready = false;
  void updateDone.then(() => {
    ready = true;
  });
  expect(commitWaveNavigationTransition("feed")).toBe(true);
  await updateDone;
  expect(ready).toBe(true);
  expect(document.documentElement.dataset["waveNavigationContentPending"]).toBe(
    "true"
  );
  commitWaveNavigationContent("feed");
  expect(
    document.documentElement.dataset["waveNavigationContentPending"]
  ).toBeUndefined();
  expect(skip).not.toHaveBeenCalled();
  finish();
  await Promise.resolve();
  expect(
    document.documentElement.style.getPropertyValue("--wave-swipe-remainder")
  ).toBe("");
});

it("lets the swipe's existing fallback own navigation when capture is unavailable", () => {
  Object.defineProperty(document, "startViewTransition", { value: undefined });
  const navigate = jest.fn();
  expect(
    runWaveNavigationTransition("feed", navigate, {
      surface: document.body,
      distance: 140,
      width: 400,
    })
  ).toBe(false);
  expect(navigate).not.toHaveBeenCalled();
});

it("releases rendering at the Feed shell commit and bounds missing content readiness", async () => {
  document.body.innerHTML = '<div data-wave-navigation-screen="wave"></div>';
  runWaveNavigationTransition("feed", jest.fn());
  await Promise.resolve();
  commitWaveNavigationTransition("feed");
  await updateDone;
  expect(document.documentElement).toHaveAttribute(
    "data-wave-navigation-content-pending"
  );
  jest.advanceTimersByTime(500);
  await Promise.resolve();
  expect(skip).toHaveBeenCalledTimes(1);
  expect(document.documentElement).not.toHaveAttribute(
    "data-wave-navigation-content-pending"
  );
});

it("keeps the interruption deadline until both Feed content and shell commit", async () => {
  runWaveNavigationTransition("feed", jest.fn());
  await Promise.resolve();
  commitWaveNavigationContent("feed");
  jest.advanceTimersByTime(500);
  await updateDone;
  expect(skip).toHaveBeenCalledTimes(1);
});

describe("phone chevron Back", () => {
  beforeEach(() => {
    window.matchMedia = jest
      .fn()
      .mockImplementation((query: string) =>
        query === "(width < 768px)" ? { ...media, matches: true } : media
      );
    document.body.innerHTML = `
      <div data-wave-swipe-page>
        <header>Wave name and Join</header>
        <div data-wave-navigation-screen="wave">Channel</div>
      </div>`;
  });

  it("captures the full channel and lets existing navigation run once without a second transition", async () => {
    const navigate = jest.fn();
    runPhoneChevronBackTransition("/waves", () =>
      runWaveNavigationTransition("list", navigate)
    );
    const page = document.querySelector<HTMLElement>("[data-wave-swipe-page]");
    const content = document.querySelector<HTMLElement>(
      "[data-wave-navigation-screen]"
    );
    expect(page?.style.viewTransitionName).toBe("wave-navigation");
    expect(content?.style.viewTransitionName).toBe("");
    expect(document.documentElement.dataset["waveNavigationTransition"]).toBe(
      "chevron-back"
    );
    expect(navigate).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(1);
    // The destination belongs to the stationary root capture, including WebKit.
    expect(page?.style.viewTransitionName).toBe("");
    expect(commitWaveNavigationTransition("list", "/waves")).toBe(true);
    await updateDone;
    expect(consumeWaveSwipeHandoff()).toBe(true);
    finish();
    await Promise.resolve();
    expect(page?.style.viewTransitionName).toBe("");
  });

  it("keeps the first Back navigation when hydration acknowledges the outgoing page", async () => {
    const previousUrl = location.href;
    history.replaceState(null, "", "/messages/current");
    try {
      const navigate = jest.fn();
      runPhoneChevronBackTransition("/messages", navigate);
      expect(commitWaveNavigationTransition(null, "/messages/current")).toBe(
        false
      );
      await Promise.resolve();
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(commitWaveNavigationTransition(null, "/messages")).toBe(true);
      await updateDone;
      expect(skip).not.toHaveBeenCalled();
    } finally {
      history.replaceState(null, "", previousUrl);
    }
  });

  it("uses the stable phone web page without requiring an app content surface", async () => {
    document.body.innerHTML =
      "<div data-phone-wave-page><header>Wave name and Join</header>Channel</div>";
    const navigate = jest.fn();
    runPhoneChevronBackTransition("/waves", navigate);
    expect(
      document.querySelector<HTMLElement>("[data-phone-wave-page]")?.style
        .viewTransitionName
    ).toBe("wave-navigation");
    await Promise.resolve();
    commitWaveNavigationTransition("list", "/waves");
    await updateDone;
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it.each(["/messages", "/messages/encrypted"])(
    "slides the phone conversation until %s commits without a Wave screen",
    async (pathname) => {
      document.body.innerHTML =
        "<div data-wave-swipe-page><header>Conversation</header>Chat</div>";
      const navigate = jest.fn();
      runPhoneChevronBackTransition(pathname, navigate);
      expect(
        document.querySelector<HTMLElement>("[data-wave-swipe-page]")?.style
          .viewTransitionName
      ).toBe("wave-navigation");
      await Promise.resolve();
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(commitWaveNavigationTransition(null, pathname)).toBe(true);
      await updateDone;
      expect(skip).not.toHaveBeenCalled();
    }
  );

  it("skips the slide if a different inbox commits", async () => {
    runPhoneChevronBackTransition("/messages", jest.fn());
    await Promise.resolve();
    expect(commitWaveNavigationTransition(null, "/messages/encrypted")).toBe(
      true
    );
    await updateDone;
    expect(skip).toHaveBeenCalledTimes(1);
  });

  it.each(["pointerdown", "resize"])(
    "keeps navigation when %s interrupts the capture",
    async (eventName) => {
      const navigate = jest.fn();
      runPhoneChevronBackTransition("/waves", navigate);
      const target = eventName === "pointerdown" ? document : window;
      if (eventName === "resize")
        Object.defineProperty(window, "innerWidth", { value: 768 });
      target.dispatchEvent(new Event(eventName));
      await updateDone;
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(skip).toHaveBeenCalledTimes(1);
    }
  );

  it("keeps motion on a resize that does not change the page width", async () => {
    runPhoneChevronBackTransition("/waves", jest.fn());
    window.dispatchEvent(new Event("resize"));
    await Promise.resolve();
    commitWaveNavigationTransition("list", "/waves");
    await updateDone;
    expect(skip).not.toHaveBeenCalled();
    finish();
    await Promise.resolve();
  });

  it("replaces a rapid second tap without stale navigation or listeners", async () => {
    const removeDocument = jest.spyOn(document, "removeEventListener");
    const removeWindow = jest.spyOn(window, "removeEventListener");
    try {
      const first = jest.fn();
      const second = jest.fn();
      runPhoneChevronBackTransition("/waves", first);
      const firstUpdate = updateDone;
      runPhoneChevronBackTransition("/waves", second);
      await firstUpdate;
      await Promise.resolve();
      commitWaveNavigationTransition("list", "/waves");
      await updateDone;
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
      finish();
      await Promise.resolve();
      expect(
        removeDocument.mock.calls.filter(([type]) => type === "pointerdown")
      ).toHaveLength(2);
      expect(
        removeWindow.mock.calls.filter(([type]) => type === "popstate")
      ).toHaveLength(2);
      expect(
        removeWindow.mock.calls.filter(([type]) => type === "resize")
      ).toHaveLength(2);
      expect(commitWaveNavigationTransition("list", "/waves")).toBe(false);
    } finally {
      removeDocument.mockRestore();
      removeWindow.mockRestore();
    }
  });

  it("does not push the chevron destination after browser history interrupts the capture", async () => {
    const navigate = jest.fn();
    runPhoneChevronBackTransition("/waves", navigate);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await updateDone;
    expect(navigate).not.toHaveBeenCalled();
    expect(skip).toHaveBeenCalledTimes(1);
  });

  it("captures the reduced-motion crossfade without replaying the content fallback", async () => {
    media.matches = true;
    const navigate = jest.fn();
    runPhoneChevronBackTransition("/waves", navigate);
    await Promise.resolve();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(1);
    commitWaveNavigationTransition(null, "/waves");
    await updateDone;
    finish();
    expect(consumeWaveSwipeHandoff()).toBe(true);
    expect(consumeWaveSwipeHandoff()).toBe(false);
  });

  it("leaves wider layouts on their existing navigation path", () => {
    window.matchMedia = jest.fn().mockReturnValue(media);
    const navigate = jest.fn();
    runPhoneChevronBackTransition("/waves", navigate);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(consumeWaveSwipeHandoff()).toBe(false);
  });

  it("clears a superseded content snapshot before capturing its parent", async () => {
    runWaveNavigationTransition("feed", jest.fn());
    const content = document.querySelector<HTMLElement>(
      "[data-wave-navigation-screen]"
    );
    expect(content?.style.viewTransitionName).toBe("wave-navigation");
    runPhoneChevronBackTransition("/waves", jest.fn());
    expect(content?.style.viewTransitionName).toBe("");
    await Promise.resolve();
    expect(document.documentElement.dataset["waveNavigationTransition"]).toBe(
      "chevron-back"
    );
    commitWaveNavigationTransition("list", "/waves");
    await updateDone;
  });
});
