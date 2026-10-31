import { redactSensitiveQueryParams } from "@/utils/monitoring/sensitiveQueryParams";

const GOOGLE_ANALYTICS_ID = "G-71NLVV3KY3";
const GOOGLE_ANALYTICS_SCRIPT_URL = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
const GOOGLE_ANALYTICS_COOKIE_EXPIRES_SECONDS = 31_536_000;

// The standard gtag bootstrap. It is constant text: page URLs and titles are
// passed to gtag() as data and never become part of a script's source.
const GTAG_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
`;

// Input that shows the visitor is using the page. Scroll events are left out:
// the app scrolls some views by itself while they load, which would start the
// download during first load. Touch scrolling starts with touchstart.
const FIRST_INTERACTION_EVENTS = [
  "pointerdown",
  "touchstart",
  "keydown",
  "wheel",
] as const;
// Passive, so the listeners never delay scrolling or touch. Capture, so they
// run before page handlers that stop propagation.
const LISTENER_OPTIONS = { capture: true, passive: true } as const;
// After the window load event, wait for an idle moment, but no longer.
const IDLE_TIMEOUT_MS = 3_000;
// Safari and the iOS app have no requestIdleCallback; wait this long after
// the load event instead.
const NO_IDLE_CALLBACK_DELAY_MS = 1_000;
// Slow media can hold the load event back for a long time. Load anyway once
// this much time has passed since the consent decision.
const MAX_WAIT_MS = 10_000;

type Gtag = (...command: unknown[]) => void;

type PageSnapshot = {
  readonly url: string;
  readonly title: string;
};

// Encrypted chat URLs name the chat (/messages/encrypted/0x<group>), and the
// new-chat page can carry who it is for in its query.
const ENCRYPTED_MESSAGES_PATH_PATTERN = /^\/messages\/encrypted(?:\/|$)/;
const ENCRYPTED_STATIC_SEGMENTS: ReadonlySet<string> = new Set([
  "devices",
  "new",
]);
const ENCRYPTED_CHAT_PATH = "/messages/encrypted/[chat]";

const isEncryptedMessagesPath = (pathname: string): boolean =>
  ENCRYPTED_MESSAGES_PATH_PATTERN.test(pathname);

/**
 * Any encrypted-chat path is reported as /messages/encrypted/[chat], without
 * its query; the list, devices and new-chat pages keep their path. Other
 * URLs are returned unchanged.
 */
export function normalizeAnalyticsUrl(href: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  if (!isEncryptedMessagesPath(url.pathname)) {
    return href;
  }
  const segment = url.pathname.split("/")[3] ?? "";
  if (segment !== "" && !ENCRYPTED_STATIC_SEGMENTS.has(segment)) {
    url.pathname = ENCRYPTED_CHAT_PATH;
  }
  url.search = "";
  url.hash = "";
  return url.href;
}

// Google Analytics leaves the fragment out of page_location, so page URLs are
// compared and reported without it. One-time link credentials in the query
// (connection-sharing links, for example) are redacted, and encrypted chat
// paths normalized, before any URL reaches gtag().
const getPageUrl = (): string => {
  const url = new URL(globalThis.location.href);
  url.hash = "";
  return normalizeAnalyticsUrl(redactSensitiveQueryParams(url.href));
};

const sanitizeReferrer = (referrer: string): string =>
  normalizeAnalyticsUrl(redactSensitiveQueryParams(referrer));

/**
 * gtag.js reads the address bar and the referrer itself for the events it
 * sends on its own. When either still carries a link credential or names an
 * encrypted chat as gtag.js loads, the config pins the sanitized value, so no
 * event reports it. Ordinary URLs keep gtag.js' default page tracking.
 */
const getCredentialSafeConfig = (): Record<string, string> => {
  const config: Record<string, string> = {};
  const { href, pathname } = globalThis.location;
  if (
    redactSensitiveQueryParams(href) !== href ||
    isEncryptedMessagesPath(pathname)
  ) {
    config["page_location"] = getPageUrl();
  }
  const { referrer } = globalThis.document;
  const sanitizedReferrer = sanitizeReferrer(referrer);
  if (sanitizedReferrer !== referrer) {
    config["page_referrer"] = sanitizedReferrer;
  }
  return config;
};

let navigationPinInstalled = false;
let pinnedUrl = "";

/**
 * gtag.js reports client navigations itself, reading the address bar. The
 * history methods are wrapped before gtag.js loads (gtag.js then wraps these
 * wrappers), so each navigation first sets the sanitized page_location and
 * page_referrer that gtag.js' own page view uses. popstate listeners run in
 * the order added, so this one also runs before gtag.js'.
 */
function pinSanitizedPageOnNavigation(currentUrl: string): void {
  pinnedUrl = currentUrl;
  if (navigationPinInstalled) {
    return;
  }
  navigationPinInstalled = true;
  const pin = () => {
    try {
      const gtag = getGtag();
      const url = getPageUrl();
      if (!gtag || url === pinnedUrl) {
        return;
      }
      gtag("set", { page_location: url, page_referrer: pinnedUrl });
      pinnedUrl = url;
    } catch {
      // Analytics never breaks navigation.
    }
  };
  const { history } = globalThis;
  for (const method of ["pushState", "replaceState"] as const) {
    const original = history[method];
    history[method] = function (
      this: History,
      ...args: Parameters<History["pushState"]>
    ): void {
      original.apply(this, args);
      pin();
    };
  }
  globalThis.addEventListener("popstate", pin);
}

const capturePage = (): PageSnapshot => ({
  url: getPageUrl(),
  title: globalThis.document.title,
});

const getGtag = (): Gtag | undefined => {
  const { gtag } = globalThis as typeof globalThis & { gtag?: unknown };
  return typeof gtag === "function" ? (gtag as Gtag) : undefined;
};

/**
 * Runs the task once: after the window load event when the browser is idle,
 * on the visitor's first interaction, or after MAX_WAIT_MS, whichever comes
 * first. This mirrors next/script's lazyOnload timing and adds the
 * interaction and time limits. Returns a function that cancels the task if it
 * has not run yet and reports whether it did.
 */
function runWhenPageSettlesOrVisitorInteracts(task: () => void): () => boolean {
  let pending = true;
  let idleHandle: number | undefined;
  let delayHandle: ReturnType<typeof setTimeout> | undefined;

  function stop(): void {
    pending = false;
    clearTimeout(maxWaitHandle);
    clearTimeout(delayHandle);
    // Some WebViews ship requestIdleCallback without cancelIdleCallback.
    if (
      idleHandle !== undefined &&
      typeof globalThis.cancelIdleCallback === "function"
    ) {
      globalThis.cancelIdleCallback(idleHandle);
    }
    globalThis.removeEventListener("load", waitForIdle);
    for (const type of FIRST_INTERACTION_EVENTS) {
      globalThis.removeEventListener(type, run, LISTENER_OPTIONS);
    }
  }

  function run(): void {
    if (!pending) {
      return;
    }
    stop();
    task();
  }

  function waitForIdle(): void {
    if (typeof globalThis.requestIdleCallback === "function") {
      idleHandle = globalThis.requestIdleCallback(run, {
        timeout: IDLE_TIMEOUT_MS,
      });
      return;
    }
    delayHandle = setTimeout(run, NO_IDLE_CALLBACK_DELAY_MS);
  }

  const maxWaitHandle = setTimeout(run, MAX_WAIT_MS);
  for (const type of FIRST_INTERACTION_EVENTS) {
    globalThis.addEventListener(type, run, LISTENER_OPTIONS);
  }
  if (globalThis.document.readyState === "complete") {
    waitForIdle();
  } else {
    globalThis.addEventListener("load", waitForIdle, { once: true });
  }

  return () => {
    if (!pending) {
      return false;
    }
    stop();
    return true;
  };
}

/**
 * Adds gtag.js and queues the same page views it would have sent had it
 * loaded when consent was decided. gtag.js reads the address bar when it
 * processes its queue, so the automatic page view is turned off and the
 * landing page is reported explicitly. A client navigation that happened
 * before gtag.js was ready gets its own page view, as the history listener
 * of gtag.js would have sent it.
 */
function loadGoogleAnalytics(landing: PageSnapshot): void {
  const current = capturePage();
  const landingTitle =
    current.url === landing.url ? current.title : landing.title;

  const bootstrap = globalThis.document.createElement("script");
  bootstrap.textContent = GTAG_BOOTSTRAP;
  globalThis.document.head.appendChild(bootstrap);

  // Without gtag() the landing page view cannot be queued, so gtag.js is not
  // downloaded at all rather than loaded without its page views.
  const gtag = getGtag();
  if (!gtag) {
    return;
  }

  gtag("config", GOOGLE_ANALYTICS_ID, {
    cookie_expires: GOOGLE_ANALYTICS_COOKIE_EXPIRES_SECONDS,
    send_page_view: false,
    ...getCredentialSafeConfig(),
  });
  gtag("event", "page_view", {
    page_location: landing.url,
    page_title: landingTitle,
  });

  let reportedUrl = landing.url;
  const reportNavigationBeforeReady = () => {
    const currentUrl = getPageUrl();
    if (currentUrl === reportedUrl) {
      return;
    }
    gtag("event", "page_view", {
      page_location: currentUrl,
      page_referrer: reportedUrl,
    });
    reportedUrl = currentUrl;
  };
  reportNavigationBeforeReady();
  pinSanitizedPageOnNavigation(reportedUrl);

  const script = globalThis.document.createElement("script");
  script.src = GOOGLE_ANALYTICS_SCRIPT_URL;
  script.async = true;
  script.addEventListener("load", reportNavigationBeforeReady, { once: true });
  globalThis.document.head.appendChild(script);
}

/**
 * Schedules Google Analytics for a visitor whose performance consent is
 * known, keeping gtag.js (about 176 KB) out of first load. The page in the
 * address bar now is the landing page its first page view reports.
 * `hasConsent` is checked again just before loading. Returns a function that
 * cancels a load that has not started and reports whether it did.
 */
export function scheduleGoogleAnalytics(
  hasConsent: () => boolean
): () => boolean {
  const landing = capturePage();
  return runWhenPageSettlesOrVisitorInteracts(() => {
    if (hasConsent()) {
      loadGoogleAnalytics(landing);
    }
  });
}
