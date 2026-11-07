import { publicEnv } from "@/config/env";
import { addTransitionObserver } from "@/lib/action-lifecycle";
import {
  classifyAsset,
  classifyError,
} from "@/services/analytics/telemetry/collector";
import {
  detectBrowser,
  detectDevice,
  detectPlatform,
} from "@/services/analytics/telemetry/environment";
import {
  guardRoute,
  type AssetKind,
  type ErrorKind,
} from "@/services/analytics/telemetry/wire";
import { sanitizeEndpointGroup } from "@/utils/monitoring/mobileLaunchTimingSanitizers";
import { scrubDiagnosticText } from "./scrub";

/**
 * Flight recorder (R14 §4.2, C52): the last 5 minutes of scrubbed app events,
 * capped at about 200 KB, kept in memory on this device. A copy goes to
 * sessionStorage when the page hides or an error happens, so a reload after a
 * crash can still send it; that copy is deleted after an hour. Nothing here
 * leaves the device unless the person sends a diagnostics bundle.
 */

const RECORDER_WINDOW_MS = 5 * 60 * 1000;
export const RECORDER_MAX_BYTES = 200 * 1024;
const LOCAL_COPY_TTL_MS = 60 * 60 * 1000;
export const LOCAL_COPY_KEY = "6529:flight-recorder";
const LONG_TASK_MS = 200;
const PERSIST_THROTTLE_MS = 2000;

/** Kinds and types only: the shape `addTransitionObserver` delivers. */
type ActionTransition = {
  readonly from: string;
  readonly event: string;
  readonly to: string;
  readonly mode: string;
  readonly legal: boolean;
};

export type FlightEntry = { readonly at: number } & (
  | { readonly k: "nav"; readonly route: string }
  | {
      readonly k: "api";
      readonly method: string;
      readonly endpoint: string;
      readonly status: number | string;
      readonly ms: number;
      readonly request_id?: string;
    }
  | { readonly k: "ws"; readonly state: string }
  | ({ readonly k: "action" } & ActionTransition)
  | {
      readonly k: "error";
      readonly kind: ErrorKind;
      readonly name: string;
      readonly message: string;
      readonly frame?: string;
    }
  | { readonly k: "long_task"; readonly ms: number }
  | { readonly k: "asset"; readonly kind: AssetKind }
  | { readonly k: "visibility"; readonly state: string }
);

type FlightLog = {
  readonly saved_at: number;
  readonly entries: readonly FlightEntry[];
};

export type FlightSnapshot = {
  readonly v: 1;
  readonly captured_at: number;
  readonly app_version: string;
  readonly platform: string;
  readonly device: string;
  readonly browser: string;
  readonly flags: readonly string[];
  readonly route: string;
  readonly entries: readonly FlightEntry[];
  /** The local copy from before the last reload, if under an hour old. */
  readonly previous: FlightLog | null;
};

let entries: FlightEntry[] = [];
let bytes = 0;
let route = "/";
let previous: FlightLog | null = null;
let started = false;
let lastPersist = 0;
let deletionTimer: ReturnType<typeof setTimeout> | undefined;
const stops: Array<() => void> = [];

const isFlightRecorderEnabled = (): boolean =>
  publicEnv.NEXT_PUBLIC_FEATURE_DIAGNOSTICS === "true" &&
  typeof window !== "undefined";

// About the JSON size of an entry, without serializing it.
const sizeOf = (entry: FlightEntry): number =>
  Object.entries(entry).reduce<number>(
    (sum, [key, value]) =>
      sum +
      key.length +
      4 +
      (typeof value === "string" ? value.length + 2 : 13),
    2
  );

function prune(now: number): void {
  let drop = 0;
  while (
    drop < entries.length &&
    (now - entries[drop]!.at > RECORDER_WINDOW_MS || bytes > RECORDER_MAX_BYTES)
  ) {
    bytes -= sizeOf(entries[drop]!);
    drop += 1;
  }
  if (drop > 0) entries = entries.slice(drop);
}

function record(entry: FlightEntry): void {
  if (!isFlightRecorderEnabled()) return;
  entries.push(entry);
  bytes += sizeOf(entry);
  prune(entry.at);
}

function readLocalCopy(now: number): FlightLog | null {
  try {
    const raw = sessionStorage.getItem(LOCAL_COPY_KEY);
    if (!raw) return null;
    const log = JSON.parse(raw) as FlightLog;
    if (
      typeof log.saved_at !== "number" ||
      !Array.isArray(log.entries) ||
      now - log.saved_at > LOCAL_COPY_TTL_MS
    ) {
      sessionStorage.removeItem(LOCAL_COPY_KEY);
      return null;
    }
    return log;
  } catch {
    return null;
  }
}

/** Removes the local copy now. */
function deleteLocalCopy(): void {
  try {
    sessionStorage.removeItem(LOCAL_COPY_KEY);
  } catch {
    /* Storage unavailable. */
  }
}

function scheduleLocalCopyDeletion(savedAt: number): void {
  clearTimeout(deletionTimer);
  deletionTimer = setTimeout(
    deleteLocalCopy,
    Math.max(0, savedAt + LOCAL_COPY_TTL_MS - Date.now())
  );
}

/** Writes the local copy (on page hide or an error), at most every 2 s. */
function persistLocalCopy(force = false): void {
  if (!isFlightRecorderEnabled()) return;
  const now = Date.now();
  if (!force && now - lastPersist < PERSIST_THROTTLE_MS) return;
  lastPersist = now;
  prune(now);
  try {
    const log: FlightLog = { saved_at: now, entries };
    sessionStorage.setItem(LOCAL_COPY_KEY, JSON.stringify(log));
    scheduleLocalCopyDeletion(now);
  } catch {
    /* Storage full or unavailable: the in-memory buffer still works. */
  }
}

/** The first frame of a stack, as `file:line:col` without any query string. */
function topFrame(error: unknown): string | undefined {
  const stack = error instanceof Error ? (error.stack ?? "") : "";
  const start = stack.indexOf("/_next/");
  if (start < 0) return undefined;
  const token = (stack.slice(start).split(/[\s()]/, 1)[0] ?? "").replace(
    /[?#][^:]*/,
    ""
  );
  return /^\/_next\/[\w./-]+:\d+:\d+$/.test(token) ? token : undefined;
}

export function recordFlightError(kind: ErrorKind, error: unknown): void {
  const name =
    error instanceof Error ? scrubDiagnosticText(error.name, 40) : typeof error;
  let message = "";
  if (error instanceof Error) message = error.message;
  else if (typeof error === "string") message = error;
  const frame = topFrame(error);
  record({
    at: Date.now(),
    k: "error",
    kind,
    name,
    message: scrubDiagnosticText(message),
    ...(frame ? { frame } : {}),
  });
  persistLocalCopy();
}

export function recordFlightNavigation(template: string): void {
  route = guardRoute(template);
  record({ at: Date.now(), k: "nav", route });
}

export function recordFlightApi(input: {
  readonly method: string;
  readonly endpoint: string;
  readonly status: number | string;
  readonly durationMs: number;
  readonly requestId?: string | null | undefined;
}): void {
  // Aborted requests (common on fast navigation) would crowd out the rest.
  if (input.status === "aborted" || !isFlightRecorderEnabled()) return;
  // The backend's own or API Gateway request ID (R14 §3.4): an opaque token
  // that carries no user identifier, kept only when ID-shaped.
  const requestId = input.requestId?.trim();
  record({
    at: Date.now(),
    k: "api",
    method: /^[A-Z]{3,7}$/.test(input.method) ? input.method : "OTHER",
    endpoint: guardRoute(
      sanitizeEndpointGroup(input.endpoint)
        .replace(/^\/api(?=\/|$)/, "")
        .replaceAll(/:\w+/g, "[id]")
    ),
    status: input.status,
    ms: Math.round(input.durationMs),
    ...(requestId && /^[\w-]{8,64}$/.test(requestId)
      ? { request_id: requestId }
      : {}),
  });
}

export const recordFlightWebSocket = (state: string): void =>
  record({ at: Date.now(), k: "ws", state: scrubDiagnosticText(state, 24) });

/** Observer for every action-lifecycle transition (kinds and types only). */
export const recordActionTransition = (transition: ActionTransition): void =>
  record({
    at: Date.now(),
    k: "action",
    from: scrubDiagnosticText(transition.from, 32),
    event: scrubDiagnosticText(transition.event, 32),
    to: scrubDiagnosticText(transition.to, 32),
    mode: scrubDiagnosticText(transition.mode, 16),
    legal: transition.legal,
  });

const ENABLED_FLAG = /^NEXT_PUBLIC_(?:FEATURE_\w+|\w+_ENABLED)$/;

function enabledFlags(): string[] {
  return Object.entries(publicEnv)
    .filter(([key, value]) => ENABLED_FLAG.test(key) && value === "true")
    .map(([key]) => key)
    .sort();
}

/** What a diagnostics bundle would contain right now. Never sent from here. */
export function getFlightSnapshot(now = Date.now()): FlightSnapshot {
  prune(now);
  const { browser, major } = detectBrowser(navigator.userAgent);
  return {
    v: 1,
    captured_at: now,
    app_version: publicEnv.VERSION ?? "unknown",
    platform: detectPlatform(),
    device: detectDevice(),
    browser: major ? `${browser} ${major}` : browser,
    flags: enabledFlags(),
    route,
    entries: [...entries],
    previous:
      previous && now - previous.saved_at <= LOCAL_COPY_TTL_MS
        ? previous
        : null,
  };
}

export function startFlightRecorder(): void {
  if (started || !isFlightRecorderEnabled()) return;
  started = true;
  // One level: the next hide or error overwrites the stored copy with this
  // page's entries, so a second reload keeps only the later page. The
  // in-memory `previous` stays until its hour is up.
  previous = readLocalCopy(Date.now());
  if (previous) scheduleLocalCopyDeletion(previous.saved_at);
  const listen = <K extends keyof WindowEventMap>(
    type: K,
    handler: (event: WindowEventMap[K]) => void,
    capture = false
  ) => {
    addEventListener(type, handler, capture);
    stops.push(() => removeEventListener(type, handler, capture));
  };
  listen(
    "error",
    (event) => {
      const target = event.target;
      if (target instanceof Element) {
        record({ at: Date.now(), k: "asset", kind: classifyAsset(target) });
        return;
      }
      const error: unknown = event.error ?? event.message;
      recordFlightError(classifyError(error, "unhandled_error"), error);
    },
    true
  );
  listen("unhandledrejection", (event) =>
    recordFlightError(
      classifyError(event.reason, "unhandled_rejection"),
      event.reason
    )
  );
  const onVisibility = () => {
    record({
      at: Date.now(),
      k: "visibility",
      state: document.visibilityState,
    });
    if (document.visibilityState === "hidden") persistLocalCopy(true);
  };
  addEventListener("visibilitychange", onVisibility);
  stops.push(() => removeEventListener("visibilitychange", onVisibility));
  listen("pagehide", () => persistLocalCopy(true));
  stops.push(addTransitionObserver(recordActionTransition));
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (entry.duration > LONG_TASK_MS)
          record({
            at: Date.now(),
            k: "long_task",
            ms: Math.round(entry.duration),
          });
    });
    observer.observe({ type: "longtask", buffered: true });
    stops.push(() => observer.disconnect());
  } catch {
    /* Long tasks are not observable in this browser. */
  }
}

/** Test-only: forget all state. */
export function resetFlightRecorderForTests(): void {
  for (const stop of stops.splice(0)) stop();
  clearTimeout(deletionTimer);
  entries = [];
  bytes = 0;
  route = "/";
  previous = null;
  started = false;
  lastPersist = 0;
}
