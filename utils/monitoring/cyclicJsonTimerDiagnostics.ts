import type { Event, EventHint } from "@sentry/nextjs";

const CYCLIC_JSON_TIMER_DIAGNOSTICS_VERSION = "v1";
export const CYCLIC_JSON_TIMER_DIAGNOSTICS_TAG =
  "cyclic_json_timer_diagnostics";

const CYCLIC_JSON_ERROR_MESSAGE =
  "JSON.stringify cannot serialize cyclic structures.";
const TIMER_MECHANISM = "auto.browser.browserapierrors.setTimeout";
// Sample each timer independently so repeated failures in one long-lived
// WebView get repeated chances while stack creation stays bounded.
const DEFAULT_TIMER_SAMPLE_RATE = 1 / 16;
const MAX_SCHEDULING_FRAMES = 8;
const INTERNAL_TIMER_FUNCTION = "cyclicJsonTimerDiagnosticSetTimeout";
const INTERNAL_STACK_FUNCTIONS = new Set([INTERNAL_TIMER_FUNCTION]);
const SAFE_NAME_PATTERN = /[^\w$<>. -]/g;
// Privacy wins over callback-name fidelity: long minified names can be
// redacted because they are indistinguishable from identifier-shaped secrets.
const SENSITIVE_IDENTIFIER_PATTERN = /(?:0x[a-f\d]{8,}|[A-Za-z\d_-]{32,})/i;
const IOS_DEVICE_PATTERN = /\b(?:iPhone|iPad|iPod)\b/i;
const IOS_OTHER_BROWSER_PATTERN = /\b(?:CriOS|EdgiOS|FxiOS|OPiOS)\//i;

type TimerCallback = (this: unknown, ...args: unknown[]) => unknown;
type TimerHandler = TimerCallback | string;
type TimerSetTimeout = (
  handler: TimerHandler,
  timeout?: number,
  ...args: unknown[]
) => number;

type TimerTarget = {
  setTimeout: TimerSetTimeout;
  location?: { hostname?: string | undefined } | undefined;
  navigator?: { userAgent?: string | undefined } | undefined;
};

type SchedulingFrameOrigin = "first_party" | "third_party" | "unknown";
type SchedulingOrigin = SchedulingFrameOrigin | "mixed";

type CyclicJsonTimerSchedulingFrame = {
  file: string;
  function: string;
  line: number;
  column: number;
  origin: SchedulingFrameOrigin;
};

type CyclicJsonTimerDiagnostics = {
  schemaVersion: typeof CYCLIC_JSON_TIMER_DIAGNOSTICS_VERSION;
  timerSampleRate: number;
  callbackName: string;
  webViewFamily: string;
  scheduleOrigin: SchedulingOrigin;
  schedulingFrames: CyclicJsonTimerSchedulingFrame[];
};

type InstallOptions = {
  target?: TimerTarget | undefined;
  sampleRate?: number | undefined;
  random?: (() => number) | undefined;
  stackFactory?: (() => string | undefined) | undefined;
};

const diagnosticsByError = new WeakMap<object, CyclicJsonTimerDiagnostics>();
const installedTargets = new WeakSet<object>();

function getSafeName(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const sanitized = value.replace(SAFE_NAME_PATTERN, "_").trim();
  return sanitized ? sanitized.slice(0, 80) : fallback;
}

function getSafeFunctionName(
  value: string | undefined,
  fallback: string
): string {
  const sanitized = getSafeName(value, fallback);
  if (sanitized === INTERNAL_TIMER_FUNCTION) {
    return sanitized;
  }
  return SENSITIVE_IDENTIFIER_PATTERN.test(sanitized) ? "redacted" : sanitized;
}

function getWebViewFamily(userAgent: string): string {
  const normalized = userAgent.toLowerCase();
  if (normalized.includes("metamaskmobile")) {
    return "metamask-mobile";
  }
  if (normalized.includes("rabbymobile")) {
    return "rabby-mobile";
  }
  if (
    normalized.includes("coinbasewallet") ||
    normalized.includes("coinbase wallet")
  ) {
    return "coinbase-wallet";
  }
  return "ios-wkwebview";
}

export function isIosWkWebViewUserAgent(userAgent: string): boolean {
  if (
    !IOS_DEVICE_PATTERN.test(userAgent) ||
    !userAgent.includes("AppleWebKit/") ||
    !userAgent.includes("Mobile/") ||
    IOS_OTHER_BROWSER_PATTERN.test(userAgent)
  ) {
    return false;
  }

  const normalized = userAgent.toLowerCase();
  const knownWalletWebView =
    normalized.includes("metamaskmobile") ||
    normalized.includes("rabbymobile") ||
    normalized.includes("coinbasewallet") ||
    normalized.includes("coinbase wallet");

  return knownWalletWebView || !userAgent.includes("Safari/");
}

function getFileBasename(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  const basename = normalized.slice(normalized.lastIndexOf("/") + 1);
  return getSafeName(basename, "unknown-script");
}

function getStaticAssetPath(pathname: string): string | null {
  const staticIndex = pathname.indexOf("/_next/static/");
  if (staticIndex === -1) {
    return null;
  }
  return pathname.slice(staticIndex).slice(0, 512);
}

function getSanitizedFile(
  rawLocation: string,
  firstPartyHostname: string
): { file: string; origin: SchedulingFrameOrigin } {
  if (rawLocation === "[native code]" || rawLocation === "native") {
    return { file: "[native code]", origin: "unknown" };
  }

  if (rawLocation.startsWith("webpack-internal:///")) {
    const path = rawLocation.slice("webpack-internal:///".length);
    return {
      file: path.split(/[?#]/, 1)[0]?.slice(0, 512) ?? "webpack-internal",
      origin: "first_party",
    };
  }

  try {
    const parsed = new URL(rawLocation);
    const staticPath = getStaticAssetPath(parsed.pathname);
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
    const isFirstParty =
      isHttp &&
      (parsed.hostname === firstPartyHostname ||
        parsed.hostname === "6529.io" ||
        parsed.hostname.endsWith(".6529.io"));

    if (isFirstParty) {
      return {
        file: staticPath ?? getFileBasename(parsed.pathname),
        origin: "first_party",
      };
    }

    if (isHttp || parsed.protocol.endsWith("-extension:")) {
      return {
        file: `external/${getFileBasename(parsed.pathname)}`,
        origin: "third_party",
      };
    }

    return {
      file: "non-http-script",
      origin: "unknown",
    };
  } catch {
    return {
      file: "unknown-script",
      origin: "unknown",
    };
  }
}

function parseStackLine(
  stackLine: string,
  firstPartyHostname: string
): CyclicJsonTimerSchedulingFrame | null {
  let candidate = stackLine.trim();
  if (!candidate) {
    return null;
  }

  if (candidate.startsWith("at ")) {
    candidate = candidate.slice(3);
  }

  let functionName = "anonymous";
  let location = candidate;
  const parenthesisStart = candidate.lastIndexOf(" (");
  if (parenthesisStart > 0 && candidate.endsWith(")")) {
    functionName = getSafeFunctionName(
      candidate.slice(0, parenthesisStart),
      "anonymous"
    );
    location = candidate.slice(parenthesisStart + 2, -1);
  } else {
    const safariSeparator = candidate.lastIndexOf("@");
    if (safariSeparator !== -1) {
      functionName = getSafeFunctionName(
        candidate.slice(0, safariSeparator),
        "anonymous"
      );
      location = candidate.slice(safariSeparator + 1);
    }
  }

  const columnSeparator = location.lastIndexOf(":");
  const lineSeparator = location.lastIndexOf(":", columnSeparator - 1);
  if (lineSeparator <= 0 || columnSeparator <= lineSeparator + 1) {
    return null;
  }

  const lineText = location.slice(lineSeparator + 1, columnSeparator);
  const columnText = location.slice(columnSeparator + 1);
  if (!/^\d+$/.test(lineText) || !/^\d+$/.test(columnText)) {
    return null;
  }

  const line = Number.parseInt(lineText, 10);
  const column = Number.parseInt(columnText, 10);
  if (
    !Number.isSafeInteger(line) ||
    !Number.isSafeInteger(column) ||
    line < 1
  ) {
    return null;
  }

  const { file, origin } = getSanitizedFile(
    location.slice(0, lineSeparator),
    firstPartyHostname
  );

  return {
    file,
    function: functionName,
    line,
    column,
    origin,
  };
}

function getSchedulingOrigin(
  frames: CyclicJsonTimerSchedulingFrame[]
): SchedulingOrigin {
  const hasFirstParty = frames.some((frame) => frame.origin === "first_party");
  const hasThirdParty = frames.some((frame) => frame.origin === "third_party");
  if (hasFirstParty && hasThirdParty) {
    return "mixed";
  }
  if (hasFirstParty) {
    return "first_party";
  }
  if (hasThirdParty) {
    return "third_party";
  }
  return "unknown";
}

function createDiagnostics(
  callback: TimerCallback,
  userAgent: string,
  firstPartyHostname: string,
  sampleRate: number,
  stack: string | undefined
): CyclicJsonTimerDiagnostics {
  const schedulingFrames = (stack ?? "")
    .split("\n")
    .map((line) => parseStackLine(line, firstPartyHostname))
    .filter((frame): frame is CyclicJsonTimerSchedulingFrame => frame !== null)
    .filter((frame) => !INTERNAL_STACK_FUNCTIONS.has(frame.function))
    .slice(0, MAX_SCHEDULING_FRAMES);

  return {
    schemaVersion: CYCLIC_JSON_TIMER_DIAGNOSTICS_VERSION,
    timerSampleRate: sampleRate,
    callbackName: getSafeFunctionName(callback.name, "anonymous"),
    webViewFamily: getWebViewFamily(userAgent),
    scheduleOrigin: getSchedulingOrigin(schedulingFrames),
    schedulingFrames,
  };
}

function isExactCyclicJsonTypeError(error: unknown): error is object {
  if ((typeof error !== "object" && typeof error !== "function") || !error) {
    return false;
  }

  try {
    const candidate = error as { message?: unknown; name?: unknown };
    return (
      candidate.name === "TypeError" &&
      candidate.message === CYCLIC_JSON_ERROR_MESSAGE
    );
  } catch {
    return false;
  }
}

function normalizeSampleRate(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_TIMER_SAMPLE_RATE;
  }
  return Math.min(1, Math.max(0, value));
}

export function installCyclicJsonTimerDiagnostics(
  options: InstallOptions = {}
): boolean {
  const target =
    options.target ?? (globalThis.window as TimerTarget | undefined);
  if (!target || installedTargets.has(target)) {
    return false;
  }

  const userAgent = target.navigator?.userAgent ?? "";
  if (!isIosWkWebViewUserAgent(userAgent)) {
    return false;
  }

  const sampleRate = normalizeSampleRate(options.sampleRate);
  if (sampleRate === 0) {
    return false;
  }

  const originalSetTimeout = target.setTimeout;
  const random = options.random ?? Math.random;
  const stackFactory = options.stackFactory;
  const firstPartyHostname = target.location?.hostname ?? "6529.io";

  const diagnosticSetTimeout: TimerSetTimeout = function cyclicJsonTimerDiagnosticSetTimeout(
    this: TimerTarget,
    handler,
    timeout,
    ...args
  ) {
    if (typeof handler !== "function") {
      return originalSetTimeout.apply(target, [handler, timeout, ...args]);
    }

    let shouldSample = false;
    try {
      shouldSample = random() < sampleRate;
    } catch {
      // A diagnostics failure must preserve the original timer path.
    }
    if (!shouldSample) {
      return originalSetTimeout.apply(target, [handler, timeout, ...args]);
    }

    let diagnostics: CyclicJsonTimerDiagnostics;
    try {
      const schedulingStack = stackFactory
        ? stackFactory()
        : new Error("cyclic-json-timer-schedule").stack;
      diagnostics = createDiagnostics(
        handler,
        userAgent,
        firstPartyHostname,
        sampleRate,
        schedulingStack
      );
    } catch {
      return originalSetTimeout.apply(target, [handler, timeout, ...args]);
    }

    const diagnosticCallback: TimerCallback = function (
      this: unknown,
      ...callbackArgs
    ) {
      try {
        return handler.apply(this, callbackArgs);
      } catch (error) {
        // This intentionally covers synchronous callback throws only. Promise
        // rejections use a different Sentry mechanism and cannot be associated
        // with the timer Error object here.
        if (isExactCyclicJsonTypeError(error)) {
          diagnosticsByError.set(error, diagnostics);
        }
        throw error;
      }
    };

    return originalSetTimeout.apply(target, [
      diagnosticCallback,
      timeout,
      ...args,
    ]);
  };

  try {
    // Preserve the diagnostic frame name through production minification so
    // stack cleanup does not rely on a fixed frame position.
    Object.defineProperty(diagnosticSetTimeout, "name", {
      configurable: true,
      value: INTERNAL_TIMER_FUNCTION,
    });
    target.setTimeout = diagnosticSetTimeout;
    installedTargets.add(target);
    return true;
  } catch {
    return false;
  }
}

function isMatchingSentryEvent(event: Event): boolean {
  const value = event.exception?.values?.[0];
  return (
    value?.type === "TypeError" &&
    value.value === CYCLIC_JSON_ERROR_MESSAGE &&
    value.mechanism?.type === TIMER_MECHANISM &&
    value.mechanism.handled === false
  );
}

export function enrichCyclicJsonTimerEvent(
  event: Event,
  hint?: EventHint
): void {
  if (!isMatchingSentryEvent(event)) {
    return;
  }

  // BrowserApiErrors includes timer arguments by default. Strip them from every
  // matching event, sampled or not, because they may contain user or wallet
  // data and are unnecessary for origin diagnostics.
  const safeExtra = { ...event.extra };
  delete safeExtra["arguments"];
  event.extra = safeExtra;

  const originalException = hint?.originalException;
  if (
    (typeof originalException !== "object" &&
      typeof originalException !== "function") ||
    !originalException
  ) {
    return;
  }

  const diagnostics = diagnosticsByError.get(originalException);
  if (!diagnostics) {
    return;
  }

  event.tags = {
    ...event.tags,
    [CYCLIC_JSON_TIMER_DIAGNOSTICS_TAG]: diagnostics.schemaVersion,
    cyclic_json_timer_schedule_origin: diagnostics.scheduleOrigin,
  };
  event.extra = {
    ...safeExtra,
    cyclicJsonTimerDiagnostics: diagnostics,
  };
}
