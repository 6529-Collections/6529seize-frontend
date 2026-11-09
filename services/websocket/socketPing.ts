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
// A keepalive PING is sent again once; two unanswered in a row mean dead.
export const PONG_TIMEOUT_MS = 5_000;
export const MAX_MISSED_PONGS = 2;
// A probe on resume gets one PING: no answer means dead. The round trip is
// about 200 ms, and without PING the socket would be replaced at once.
export const PROBE_TIMEOUT_MS = 3_000;

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

type PingKind = "keepalive" | "probe";

/**
 * Keeps one socket alive and checks whether it still answers. Any frame
 * received answers a PING, a PONG or not.
 * - Keepalive: after a quiet spell of about 8 minutes (no frame either way)
 *   in a visible tab, it sends a PING, so the gateway's 10-minute idle close
 *   never ends a visible tab's session. Unanswered within 5 s, it is sent
 *   again; after two in a row the socket is dead.
 * - Probe, for a socket whose liveness is in doubt on resume (`probe()`, or a
 *   hidden tab shown again after such a spell): one PING, and no answer within
 *   3 s means dead. A probe replaces a keepalive PING in flight.
 * A dead socket is reported through `onDead`, once.
 */
export class SocketPinger {
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingKind: PingKind | null = null;
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
    this.pendingKind = null;
    this.missed = 0;
    this.noteActivity();
  }

  /** Any frame sent. */
  noteSent(): void {
    if (this.pendingKind === null) this.noteActivity();
  }

  probe(): void {
    if (!this.stopped && this.pendingKind !== "probe") this.ping("probe");
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

  // Shown again after a quiet spell, the tab probes; otherwise the keepalive
  // waits out the rest of the spell.
  private readonly onVisibilityChange = (): void => {
    if (this.stopped || this.pendingKind !== null || !isTabVisible()) return;
    const remainingMs = this.keepaliveRemainingMs();
    if (remainingMs > 0) this.scheduleKeepalive(remainingMs);
    else this.probe();
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
      if (this.stopped || this.pendingKind !== null) return;
      const remainingMs = this.keepaliveRemainingMs();
      if (remainingMs > 0) this.scheduleKeepalive(remainingMs);
      else if (isTabVisible()) this.ping("keepalive");
      // A hidden tab sends nothing; showing it again checks the quiet spell.
    }, delayMs);
  }

  private keepaliveRemainingMs(): number {
    return this.keepaliveAfterMs - (Date.now() - this.lastActivityAt);
  }

  private ping(kind: PingKind): void {
    if (this.ws.readyState !== WebSocket.OPEN) return;
    this.clearIdleTimer();
    this.clearPongTimer();
    const id = nextPingId();
    this.pendingKind = kind;
    this.ws.send(JSON.stringify({ type: "PING", id }));
    this.pongTimer = setTimeout(
      () => {
        this.pongTimer = null;
        this.pendingKind = null;
        this.missed += 1;
        if (kind === "keepalive" && this.missed < MAX_MISSED_PONGS) {
          this.ping("keepalive");
          return;
        }
        this.stop();
        this.onDead();
      },
      kind === "probe" ? PROBE_TIMEOUT_MS : PONG_TIMEOUT_MS
    );
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
