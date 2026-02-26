"use client";

import { startSpanManual } from "@sentry/nextjs";

import type { Span } from "@sentry/nextjs";

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
  timeoutId: TimeoutId | null;
};

type TimeoutId = ReturnType<typeof globalThis.setTimeout> | number;

const pendingOpens = new Map<string, PendingDropOpen>();
const DROP_OPEN_TIMEOUT_MS = 30000;

const getNowMs = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

const getRoute = () => {
  const win = globalThis.window ?? null;
  if (!win || !win.location) {
    return "";
  }
  return `${win.location.pathname}${win.location.search}`;
};

const getRumClient = () => {
  const win = globalThis.window ?? null;
  if (!win) {
    return undefined;
  }
  return (win as unknown as { awsRum?: { recordEvent?: Function } })?.awsRum;
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
  const win = globalThis.window ?? null;

  const { dropId, waveId, source, isMobile } = params;
  const startMs = getNowMs();

  const existing = pendingOpens.get(dropId);
  if (existing) {
    if (existing.timeoutId !== null) {
      globalThis.clearTimeout(existing.timeoutId);
    }
    endSentrySpan(existing.span);
    pendingOpens.delete(dropId);
  }

  const registerPendingOpen = (createdSpan: Span | null) => {
    const handleTimeout = () => {
      const entry = pendingOpens.get(dropId);
      endSentrySpan(entry?.span ?? null);
      pendingOpens.delete(dropId);
    };

    const timeoutId =
      win && typeof win.setTimeout === "function"
        ? win.setTimeout(handleTimeout, DROP_OPEN_TIMEOUT_MS)
        : typeof globalThis.setTimeout === "function"
          ? globalThis.setTimeout(handleTimeout, DROP_OPEN_TIMEOUT_MS)
          : null;

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
        name: "ui.drop_popup.open",
        op: "ui.action",
        attributes: {
          drop_id: dropId,
          wave_id: waveId,
          source,
          is_mobile: isMobile,
          route: getRoute(),
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
  if (!entry || entry.waveId !== params.waveId) {
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
      drop_id: activeEntry.dropId,
      wave_id: activeEntry.waveId,
      source: activeEntry.source,
      is_mobile: activeEntry.isMobile,
      route: getRoute(),
    };

    const rum = getRumClient();
    if (rum && typeof rum.recordEvent === "function") {
      try {
        const recordEvent = rum.recordEvent as (
          name: string,
          data?: Record<string, unknown>
        ) => void;
        recordEvent("drop_popup_ready", payload);
      } catch {
        // ignore analytics errors
      }
    }

    if (activeEntry.span) {
      try {
        activeEntry.span.setAttribute("duration_ms", durationMs);
        activeEntry.span.setAttribute("route", payload.route);
        endSentrySpan(activeEntry.span);
      } catch {
        // ignore tracing errors
      }
    }

    if (activeEntry.timeoutId !== null) {
      globalThis.clearTimeout(activeEntry.timeoutId);
    }
    pendingOpens.delete(activeEntry.dropId);
  };

  // Wait for next paint so "ready" reflects rendered UI.
  requestAnimationFrame(() => requestAnimationFrame(finish));
};
