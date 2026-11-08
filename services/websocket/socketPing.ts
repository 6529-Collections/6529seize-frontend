import { publicEnv } from "@/config/env";
import { applyDelayJitter } from "@/helpers/jitter.helpers";

/**
 * PING/PONG keepalive and liveness checks for the app socket (API #2354),
 * staged behind a build flag. On only when exactly "true". A server without
 * PONG never answers, so the flag must stay off until it is live.
 */
export const isWsPingEnabled = (): boolean =>
  publicEnv.NEXT_PUBLIC_FEATURE_WS_PING === "true";

// API Gateway closes a WebSocket after 10 minutes with no frame either way.
export const KEEPALIVE_IDLE_MS = 8 * 60_000;
// ±10%, so a visible tab pings 7.2–8.8 minutes into a quiet spell.
const KEEPALIVE_JITTER_RATIO = 0.1;
export const PONG_TIMEOUT_MS = 5_000;
// PINGs left unanswered in a row before the socket counts as dead.
export const MAX_MISSED_PONGS = 2;

let pingCount = 0;
// The API accepts ids matching ^[A-Za-z0-9_.:-]{1,32}$.
const nextPingId = (): string =>
  `p${(++pingCount).toString(36)}.${Date.now().toString(36)}`;

/** A `{"type":"PONG",…}` frame: it only proves the socket is alive. */
export const isPongFrame = (frame: unknown): boolean =>
  typeof frame === "object" &&
  frame !== null &&
  (frame as { readonly type?: unknown }).type === "PONG";

const isTabVisible = (): boolean =>
  typeof document === "undefined" || document.visibilityState === "visible";

/**
 * Keeps one socket alive and checks whether it still answers.
 * - Keepalive: after a quiet spell of about 8 minutes (no frame either way)
 *   in a visible tab, it sends a PING, so the gateway's 10-minute idle close
 *   never ends a visible tab's session. A hidden tab sends nothing; when it
 *   is shown again after such a spell, it pings at once.
 * - `probe()` sends a PING now, for a socket whose liveness is in doubt.
 * Any frame received answers a PING, a PONG or not. A PING unanswered within
 * 5 s is sent again; after two in a row the socket is reported dead through
 * `onDead`, once.
 */
export class SocketPinger {
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingId: string | null = null;
  private missed = 0;
  private lastActivityAt = Date.now();
  // This quiet spell's jittered keepalive delay.
  private keepaliveAfterMs = KEEPALIVE_IDLE_MS;
  private stopped = false;

  constructor(
    readonly ws: WebSocket,
    private readonly onDead: () => void
  ) {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.onVisibilityChange);
    }
    this.armKeepalive();
  }

  /** Any frame received: the socket is alive. */
  noteReceived(): void {
    this.clearPongTimer();
    this.pendingId = null;
    this.missed = 0;
    this.noteActivity();
  }

  /** Any frame sent. */
  noteSent(): void {
    if (this.pendingId === null) this.noteActivity();
  }

  probe(): void {
    if (!this.stopped && this.pendingId === null) this.ping();
  }

  stop(): void {
    this.stopped = true;
    this.clearIdleTimer();
    this.clearPongTimer();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
    }
  }

  // Cheap on a busy socket: a frame only moves the timestamp, and the
  // timer re-arms itself for whatever remains of the quiet spell.
  private noteActivity(): void {
    this.lastActivityAt = Date.now();
    if (this.idleTimer === null) this.armKeepalive();
  }

  private readonly onVisibilityChange = (): void => {
    if (this.stopped || this.pendingId !== null || !isTabVisible()) return;
    this.onKeepaliveDue();
  };

  private armKeepalive(): void {
    if (this.stopped || this.idleTimer !== null) return;
    this.keepaliveAfterMs = applyDelayJitter(
      KEEPALIVE_IDLE_MS,
      KEEPALIVE_JITTER_RATIO
    );
    this.scheduleKeepalive(this.keepaliveAfterMs);
  }

  private scheduleKeepalive(delayMs: number): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null;
      this.onKeepaliveDue();
    }, delayMs);
  }

  private onKeepaliveDue(): void {
    if (this.stopped || this.pendingId !== null) return;
    const remainingMs =
      this.keepaliveAfterMs - (Date.now() - this.lastActivityAt);
    if (remainingMs > 0) this.scheduleKeepalive(remainingMs);
    else if (isTabVisible()) this.ping();
    // A hidden tab sends nothing; showing it again checks the quiet spell.
  }

  private ping(): void {
    if (this.ws.readyState !== WebSocket.OPEN) return;
    this.clearIdleTimer();
    const id = nextPingId();
    this.pendingId = id;
    this.ws.send(JSON.stringify({ type: "PING", id }));
    this.pongTimer = setTimeout(() => {
      this.pongTimer = null;
      if (this.pendingId !== id) return;
      this.pendingId = null;
      this.missed += 1;
      if (this.missed < MAX_MISSED_PONGS) {
        this.ping();
        return;
      }
      this.stop();
      this.onDead();
    }, PONG_TIMEOUT_MS);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }

  private clearPongTimer(): void {
    if (this.pongTimer) clearTimeout(this.pongTimer);
    this.pongTimer = null;
  }
}
