"use client";

import { startSpanManual } from "@sentry/core";
import type { Span } from "@sentry/core";

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
  timeoutId: number | null;
};

const pendingOpens = new Map<string, PendingDropOpen>();
const DROP_OPEN_TIMEOUT_MS = 30000;

const getNowMs = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

const getRoute = () => {
  const win = globalThis.window;
  return `${win.location.pathname}${win.location.search}`;
};

const getRumClient = () => {
  const win = globalThis.window;
  return (win as unknown as { awsRum?: { recordEvent?: Function } }).awsRum;
};

export const startDropOpen = (params: {
  dropId: string;
  waveId: string;
  source: DropOpenSource;
  isMobile: boolean;
}) => {
  const win = globalThis.window;

  const { dropId, waveId, source, isMobile } = params;
  const startMs = getNowMs();

  let span: Span | null = null;
  try {
    span = startSpanManual(
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
      (createdSpan) => createdSpan
    );
  } catch {
    span = null;
  }

  const timeoutId = win.setTimeout(() => {
    pendingOpens.delete(dropId);
  }, DROP_OPEN_TIMEOUT_MS);

  pendingOpens.set(dropId, {
    startMs,
    dropId,
    waveId,
    source,
    isMobile,
    span,
    timeoutId,
  });
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
    const durationMs = Math.round(getNowMs() - entry.startMs);
    const payload = {
      duration_ms: durationMs,
      drop_id: entry.dropId,
      wave_id: entry.waveId,
      source: entry.source,
      is_mobile: entry.isMobile,
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

    if (entry.span) {
      try {
        entry.span.setAttribute("duration_ms", durationMs);
        entry.span.setAttribute("route", payload.route);
        entry.span.end();
      } catch {
        // ignore tracing errors
      }
    }

    if (entry.timeoutId !== null) {
      globalThis.clearTimeout(entry.timeoutId);
    }
    pendingOpens.delete(entry.dropId);
  };

  // Wait for next paint so "ready" reflects rendered UI.
  requestAnimationFrame(() => requestAnimationFrame(finish));
};
