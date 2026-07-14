"use client";

import { startSpanManual } from "@sentry/nextjs";
import type { Span } from "@sentry/nextjs";
import { sanitizeRouteFamily } from "./mobileLaunchTimingSanitizers";

export const DROP_OPEN_SIGNAL_NAMES = {
  readyEvent: "drop_popup_ready",
  span: "ui.drop_popup.open",
} as const;

type DropOpenSource =
  | "leaderboard_list"
  | "leaderboard_grid"
  | "leaderboard_memes"
  | "leaderboard_mobile_menu";

type PendingDropOpen = {
  startMs: number;
  dropId: string;
  waveId: string;
  source: DropOpenSource;
  isMobile: boolean;
  span: Span | null;
  timeoutId: TimeoutId;
};

type TimeoutId = ReturnType<typeof globalThis.setTimeout>;

const pendingOpens = new Map<string, PendingDropOpen>();
const DROP_OPEN_TIMEOUT_MS = 30000;

const getNowMs = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

const getRouteFamily = (): string => {
  return sanitizeRouteFamily(globalThis.window.location.pathname);
};

type RumClient = {
  readonly recordEvent?: (name: string, data?: Record<string, unknown>) => void;
};

const getRumClient = (): RumClient | undefined => {
  return (globalThis.window as unknown as { readonly awsRum?: RumClient })
    .awsRum;
};

const endSentrySpan = (span: Span | null) => {
  if (!span) {
    return;
  }

  try {
    const maybeSpan = span as unknown as {
      end?: () => void;
      finish?: () => void;
    };
    if (typeof maybeSpan.end === "function") {
      maybeSpan.end();
      return;
    }
    if (typeof maybeSpan.finish === "function") {
      maybeSpan.finish();
    }
  } catch {
    // ignore tracing errors
  }
};

export const startDropOpen = (params: {
  dropId: string;
  waveId: string;
  source: DropOpenSource;
  isMobile: boolean;
}) => {
  const { dropId, waveId, source, isMobile } = params;
  const startMs = getNowMs();

  const existing = pendingOpens.get(dropId);
  if (existing) {
    globalThis.clearTimeout(existing.timeoutId);
    endSentrySpan(existing.span);
    pendingOpens.delete(dropId);
  }

  const registerPendingOpen = (createdSpan: Span | null) => {
    const handleTimeout = () => {
      const entry = pendingOpens.get(dropId);
      endSentrySpan(entry?.span ?? null);
      pendingOpens.delete(dropId);
    };

    const timeoutId = globalThis.setTimeout(
      handleTimeout,
      DROP_OPEN_TIMEOUT_MS
    );

    pendingOpens.set(dropId, {
      startMs,
      dropId,
      waveId,
      source,
      isMobile,
      span: createdSpan,
      timeoutId,
    });
  };

  try {
    startSpanManual(
      {
        name: DROP_OPEN_SIGNAL_NAMES.span,
        op: "ui.action",
        attributes: {
          source,
          is_mobile: isMobile,
          "route.family": getRouteFamily(),
        },
      },
      (createdSpan) => {
        registerPendingOpen(createdSpan);
      }
    );
  } catch {
    registerPendingOpen(null);
  }
};

export const markDropOpenReady = (params: {
  dropId: string;
  waveId: string;
}) => {
  const entry = pendingOpens.get(params.dropId);
  if (entry?.waveId !== params.waveId) {
    return;
  }

  const finish = () => {
    const activeEntry = pendingOpens.get(entry.dropId);
    if (!activeEntry) {
      return;
    }
    const isSameEntry =
      activeEntry === entry ||
      (activeEntry.startMs === entry.startMs &&
        activeEntry.waveId === entry.waveId);
    if (!isSameEntry) {
      return;
    }

    const durationMs = Math.round(getNowMs() - activeEntry.startMs);
    const payload = {
      duration_ms: durationMs,
      source: activeEntry.source,
      is_mobile: activeEntry.isMobile,
      route_family: getRouteFamily(),
    };

    const recordEvent = getRumClient()?.recordEvent;
    if (typeof recordEvent === "function") {
      try {
        // Compatibility destination until external AWS RUM usage is verified.
        recordEvent(DROP_OPEN_SIGNAL_NAMES.readyEvent, payload);
      } catch {
        // ignore analytics errors
      }
    }

    if (activeEntry.span) {
      try {
        activeEntry.span.setAttribute("duration_ms", durationMs);
        activeEntry.span.setAttribute("route.family", payload.route_family);
        endSentrySpan(activeEntry.span);
      } catch {
        // ignore tracing errors
      }
    }

    globalThis.clearTimeout(activeEntry.timeoutId);
    pendingOpens.delete(activeEntry.dropId);
  };

  // Wait for next paint so "ready" reflects rendered UI.
  requestAnimationFrame(() => requestAnimationFrame(finish));
};
