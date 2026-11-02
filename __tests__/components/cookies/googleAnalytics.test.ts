import {
  normalizeAnalyticsUrl,
  scheduleGoogleAnalytics,
} from "@/components/cookies/googleAnalytics";

type AnalyticsWindow = typeof globalThis & {
  dataLayer?: unknown[];
  gtag?: unknown;
};

// jsdom has no requestIdleCallback; tests add and remove it.
type IdleCallbackWindow = {
  requestIdleCallback?: unknown;
  cancelIdleCallback?: unknown;
};

const analyticsWindow = globalThis as AnalyticsWindow;
const idleCallbackWindow = globalThis as unknown as IdleCallbackWindow;
const GA_SCRIPT_URL =
  "https://www.googletagmanager.com/gtag/js?id=G-71NLVV3KY3";
const LANDING_URL = "http://localhost/landing?section=top";

const gtagScripts = (): HTMLScriptElement[] =>
  Array.from(document.head.querySelectorAll("script")).filter(
    (script) => script.src === GA_SCRIPT_URL
  );

/** The gtag commands queued for gtag.js, without the 'js' timestamp. */
const queuedCommands = (): unknown[][] =>
  (analyticsWindow.dataLayer ?? [])
    .map((command) => Array.from(command as ArrayLike<unknown>))
    .filter((command) => command[0] !== "js");

const setReadyState = (state: DocumentReadyState) => {
  jest.spyOn(document, "readyState", "get").mockReturnValue(state);
};

describe("scheduleGoogleAnalytics", () => {
  let cancel: (() => boolean) | undefined;
  const hasConsent = jest.fn(() => true);

  beforeEach(() => {
    jest.useFakeTimers();
    hasConsent.mockReturnValue(true);
    document.head.innerHTML = "";
    delete analyticsWindow.dataLayer;
    // The bootstrap declares a global function, which cannot be deleted.
    analyticsWindow.gtag = undefined;
    delete idleCallbackWindow.requestIdleCallback;
    delete idleCallbackWindow.cancelIdleCallback;
    window.history.replaceState(null, "", "/landing?section=top#intro");
    document.title = "Landing";
    setReadyState("complete");
  });

  afterEach(() => {
    cancel?.();
    cancel = undefined;
    jest.restoreAllMocks();
    jest.useRealTimers();
    window.history.replaceState(null, "", "/");
  });

  it("waits for the first interaction instead of loading during first load", () => {
    setReadyState("loading");
    cancel = scheduleGoogleAnalytics(hasConsent);

    jest.advanceTimersByTime(9_999);
    expect(gtagScripts()).toHaveLength(0);
    expect(analyticsWindow.dataLayer).toBeUndefined();

    window.dispatchEvent(new Event("pointerdown"));

    expect(gtagScripts()).toHaveLength(1);
    expect(gtagScripts()[0]?.async).toBe(true);
  });

  it.each(["touchstart", "keydown", "wheel"])(
    "treats %s as a first interaction",
    (type) => {
      setReadyState("loading");
      cancel = scheduleGoogleAnalytics(hasConsent);

      window.dispatchEvent(new Event(type));

      expect(gtagScripts()).toHaveLength(1);
    }
  );

  it("does not treat a scroll as an interaction, since views scroll themselves", () => {
    setReadyState("loading");
    cancel = scheduleGoogleAnalytics(hasConsent);

    window.dispatchEvent(new Event("scroll"));

    expect(gtagScripts()).toHaveLength(0);
  });

  it("loads at the first idle moment after the window load event", () => {
    setReadyState("loading");
    const idleCallbacks: Array<() => void> = [];
    const requestIdleCallback = jest.fn((callback: () => void) => {
      idleCallbacks.push(callback);
      return idleCallbacks.length;
    });
    idleCallbackWindow.requestIdleCallback = requestIdleCallback;
    idleCallbackWindow.cancelIdleCallback = jest.fn();
    cancel = scheduleGoogleAnalytics(hasConsent);

    expect(requestIdleCallback).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("load"));
    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 3_000,
    });
    expect(gtagScripts()).toHaveLength(0);

    idleCallbacks[0]?.();

    expect(gtagScripts()).toHaveLength(1);
  });

  it.each(["interaction", "cancel"] as const)(
    "stops a pending idle wait by %s where cancelIdleCallback is missing",
    (stopBy) => {
      setReadyState("loading");
      idleCallbackWindow.requestIdleCallback = jest.fn(() => 1);
      cancel = scheduleGoogleAnalytics(hasConsent);
      window.dispatchEvent(new Event("load"));

      if (stopBy === "interaction") {
        // A throwing stop() would end the listener before gtag.js is added.
        window.dispatchEvent(new Event("pointerdown"));
        expect(gtagScripts()).toHaveLength(1);
      } else {
        expect(cancel()).toBe(true);
        expect(gtagScripts()).toHaveLength(0);
      }
    }
  );

  it("does not download gtag.js when the gtag bootstrap did not run", () => {
    // A head that accepts nodes without executing them leaves gtag undefined.
    const appendChild = jest
      .spyOn(document.head, "appendChild")
      .mockImplementation((node) => node);
    cancel = scheduleGoogleAnalytics(hasConsent);

    window.dispatchEvent(new Event("pointerdown"));

    const appended = appendChild.mock.calls.map(
      ([node]) => node as HTMLScriptElement
    );
    expect(appended).toHaveLength(1);
    expect(appended[0]?.src).toBe("");
    expect(appended.some((node) => node.src === GA_SCRIPT_URL)).toBe(false);
  });

  it("waits one second after load where requestIdleCallback is missing", () => {
    cancel = scheduleGoogleAnalytics(hasConsent);

    jest.advanceTimersByTime(999);
    expect(gtagScripts()).toHaveLength(0);

    jest.advanceTimersByTime(1);
    expect(gtagScripts()).toHaveLength(1);
  });

  it("loads after ten seconds when slow media holds the load event back", () => {
    setReadyState("loading");
    cancel = scheduleGoogleAnalytics(hasConsent);

    jest.advanceTimersByTime(9_999);
    expect(gtagScripts()).toHaveLength(0);

    jest.advanceTimersByTime(1);
    expect(gtagScripts()).toHaveLength(1);
  });

  it("loads once however many triggers fire", () => {
    cancel = scheduleGoogleAnalytics(hasConsent);

    window.dispatchEvent(new Event("pointerdown"));
    window.dispatchEvent(new Event("keydown"));
    jest.advanceTimersByTime(20_000);

    expect(gtagScripts()).toHaveLength(1);
    expect(
      queuedCommands().filter((command) => command[0] === "config")
    ).toHaveLength(1);
  });

  it("does not load when consent is gone by the time it would load", () => {
    hasConsent.mockReturnValue(false);
    cancel = scheduleGoogleAnalytics(hasConsent);

    window.dispatchEvent(new Event("pointerdown"));

    expect(gtagScripts()).toHaveLength(0);
    expect(analyticsWindow.dataLayer).toBeUndefined();
  });

  it("cancels a load that has not started", () => {
    setReadyState("loading");
    const removeEventListener = jest.spyOn(window, "removeEventListener");
    cancel = scheduleGoogleAnalytics(hasConsent);

    expect(cancel()).toBe(true);
    window.dispatchEvent(new Event("pointerdown"));
    window.dispatchEvent(new Event("load"));
    jest.advanceTimersByTime(20_000);

    expect(gtagScripts()).toHaveLength(0);
    expect(removeEventListener).toHaveBeenCalledWith(
      "pointerdown",
      expect.any(Function),
      expect.objectContaining({ capture: true })
    );
    expect(cancel()).toBe(false);
  });

  it("reports nothing to cancel once it has loaded", () => {
    cancel = scheduleGoogleAnalytics(hasConsent);
    window.dispatchEvent(new Event("pointerdown"));

    expect(cancel()).toBe(false);
    expect(gtagScripts()).toHaveLength(1);
  });

  it("sends the landing page view a visitor who stays would get today", () => {
    cancel = scheduleGoogleAnalytics(hasConsent);
    window.dispatchEvent(new Event("pointerdown"));

    expect(analyticsWindow.dataLayer?.[0]).toBeDefined();
    expect(
      Array.from(analyticsWindow.dataLayer?.[0] as ArrayLike<unknown>)
    ).toEqual(["js", expect.any(Date)]);
    expect(queuedCommands()).toEqual([
      [
        "config",
        "G-71NLVV3KY3",
        { cookie_expires: 31_536_000, send_page_view: false },
      ],
      [
        "event",
        "page_view",
        { page_location: LANDING_URL, page_title: "Landing" },
      ],
    ]);
  });

  it("uses the landing title as it reads when gtag.js loads", () => {
    cancel = scheduleGoogleAnalytics(hasConsent);
    document.title = "Landing (updated)";
    window.dispatchEvent(new Event("pointerdown"));

    expect(queuedCommands()[1]).toEqual([
      "event",
      "page_view",
      { page_location: LANDING_URL, page_title: "Landing (updated)" },
    ]);
  });

  it("keeps the landing page and adds the current one after an early navigation", () => {
    cancel = scheduleGoogleAnalytics(hasConsent);
    window.history.pushState(null, "", "/second?tab=all");
    document.title = "Second";

    window.dispatchEvent(new Event("pointerdown"));

    expect(queuedCommands()).toEqual([
      [
        "config",
        "G-71NLVV3KY3",
        { cookie_expires: 31_536_000, send_page_view: false },
      ],
      [
        "event",
        "page_view",
        { page_location: LANDING_URL, page_title: "Landing" },
      ],
      [
        "event",
        "page_view",
        {
          page_location: "http://localhost/second?tab=all",
          page_referrer: LANDING_URL,
        },
      ],
    ]);
  });

  it("does not count a fragment-only change as a page change", () => {
    cancel = scheduleGoogleAnalytics(hasConsent);
    window.history.replaceState(null, "", "/landing?section=top#later");

    window.dispatchEvent(new Event("pointerdown"));

    expect(
      queuedCommands().filter((command) => command[1] === "page_view")
    ).toHaveLength(1);
  });

  it("reports a navigation made while gtag.js downloads once it has loaded", () => {
    cancel = scheduleGoogleAnalytics(hasConsent);
    window.dispatchEvent(new Event("pointerdown"));
    window.history.pushState(null, "", "/third");

    const [script] = gtagScripts();
    script?.dispatchEvent(new Event("load"));
    script?.dispatchEvent(new Event("load"));

    expect(
      queuedCommands().filter((command) => command[1] === "page_view")
    ).toEqual([
      [
        "event",
        "page_view",
        { page_location: LANDING_URL, page_title: "Landing" },
      ],
      [
        "event",
        "page_view",
        { page_location: "http://localhost/third", page_referrer: LANDING_URL },
      ],
    ]);
  });

  it("redacts link credentials from the page and referrer URLs it reports", () => {
    const linkValue = "synthetic-link-value";
    window.history.replaceState(
      null,
      "",
      `/accept-connection-sharing?token=${linkValue}&address=0x1#intro`
    );
    jest
      .spyOn(document, "referrer", "get")
      .mockReturnValue(
        `https://6529.io/accept-connection-sharing?connection_share_code=${linkValue}`
      );
    cancel = scheduleGoogleAnalytics(hasConsent);
    window.history.replaceState(null, "", "/second?session=other-value");
    window.dispatchEvent(new Event("pointerdown"));

    const redactedLanding =
      "http://localhost/accept-connection-sharing?token=[Filtered]&address=0x1";
    const redactedSecond = "http://localhost/second?session=[Filtered]";
    expect(queuedCommands()).toEqual([
      [
        "config",
        "G-71NLVV3KY3",
        {
          cookie_expires: 31_536_000,
          send_page_view: false,
          page_location: redactedSecond,
          page_referrer:
            "https://6529.io/accept-connection-sharing?connection_share_code=[Filtered]",
        },
      ],
      [
        "event",
        "page_view",
        { page_location: redactedLanding, page_title: "Landing" },
      ],
      [
        "event",
        "page_view",
        { page_location: redactedSecond, page_referrer: redactedLanding },
      ],
    ]);
    const queued = JSON.stringify(queuedCommands());
    expect(queued).not.toContain(linkValue);
    expect(queued).not.toContain("other-value");
  });

  it("reports encrypted chat pages without the chat id", () => {
    const chat = `0x${"c".repeat(64)}`;
    window.history.replaceState(null, "", `/messages/encrypted/${chat}`);
    jest
      .spyOn(document, "referrer", "get")
      .mockReturnValue(`https://6529.io/messages/encrypted/${chat}?q=1`);
    cancel = scheduleGoogleAnalytics(hasConsent);
    window.dispatchEvent(new Event("pointerdown"));
    window.history.pushState(
      null,
      "",
      `/messages/encrypted/0x${"d".repeat(64)}`
    );
    window.history.pushState(null, "", "/messages/encrypted/new?to=alice");
    window.history.pushState(null, "", "/network");

    const chatUrl = "http://localhost/messages/encrypted/[chat]";
    expect(queuedCommands()).toEqual([
      [
        "config",
        "G-71NLVV3KY3",
        {
          cookie_expires: 31_536_000,
          send_page_view: false,
          page_location: chatUrl,
          page_referrer: "https://6529.io/messages/encrypted/[chat]",
        },
      ],
      ["event", "page_view", { page_location: chatUrl, page_title: "Landing" }],
      [
        "set",
        {
          page_location: "http://localhost/messages/encrypted/new",
          page_referrer: chatUrl,
        },
      ],
      [
        "set",
        {
          page_location: "http://localhost/network",
          page_referrer: "http://localhost/messages/encrypted/new",
        },
      ],
    ]);
    expect(JSON.stringify(queuedCommands())).not.toMatch(/0x[cd]{8}|alice/u);
  });

  it("normalizes only encrypted chat paths", () => {
    expect(
      normalizeAnalyticsUrl(
        `https://6529.io/messages/encrypted/0x${"e".repeat(64)}/info?x=1#top`
      )
    ).toBe("https://6529.io/messages/encrypted/[chat]");
    expect(normalizeAnalyticsUrl("https://6529.io/messages/encrypted")).toBe(
      "https://6529.io/messages/encrypted"
    );
    expect(
      normalizeAnalyticsUrl("https://6529.io/messages/encrypted/devices")
    ).toBe("https://6529.io/messages/encrypted/devices");
    expect(normalizeAnalyticsUrl("https://6529.io/messages/abc?x=1")).toBe(
      "https://6529.io/messages/abc?x=1"
    );
    expect(normalizeAnalyticsUrl("")).toBe("");
  });

  it("keeps page URLs and titles out of script source", () => {
    window.history.replaceState(null, "", "/landing?token=private-link-value");
    document.title = "Private title";
    cancel = scheduleGoogleAnalytics(hasConsent);
    window.dispatchEvent(new Event("pointerdown"));

    const scriptSource = Array.from(document.head.querySelectorAll("script"))
      .map((script) => `${script.textContent ?? ""} ${script.outerHTML}`)
      .join("\n");
    expect(scriptSource).toContain(
      "function gtag(){dataLayer.push(arguments);}"
    );
    expect(scriptSource).not.toContain("private-link-value");
    expect(scriptSource).not.toContain("Private title");
  });
});
