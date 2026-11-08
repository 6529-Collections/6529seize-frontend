"use client";

import { WsMessageType } from "@/helpers/Types";
import { getWebSocketUrl } from "@/services/api/api-endpoints";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  getAuthJwt,
  isAuthJwtUsable,
} from "@/services/auth/auth.utils";
import { getSocketIdentityKey } from "./socketIdentity";

/**
 * The tab's one typing socket (WAVES-PLAN 0.12). It declares
 * `purpose=typing`, so the server sends it typing events only, and it
 * follows the open wave with SUBSCRIBE_TO_WAVE instead of reconnecting on
 * every wave switch. It opens once the tab has been visible for a moment and
 * closes a while after the reader leaves wave views.
 */

const RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_ATTEMPTS = 20;
const AUTHENTICATION_TIMEOUT_MS = 8_000;
// A tab only glanced at, or opened in the background, needs no typing socket.
const OPEN_AFTER_VISIBLE_MS = 2_000;
// A quick trip away from wave views keeps the socket and its subscription.
const CLOSE_AFTER_IDLE_MS = 30_000;
const AUTH_BROADCAST_CHANNEL = "auth-token-updates";
const TYPING_SOCKET_PURPOSE = "typing";
const AUTHENTICATION_FAILED_CLOSE_CODE = 4008;
const AUTHENTICATION_TIMEOUT_CLOSE_CODE = 4011;

export const getTypingSocketUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("purpose", TYPING_SOCKET_PURPOSE);
    return parsed.toString();
  } catch (error) {
    // Without the purpose the server sends this socket every drop again.
    console.warn("[typingSocket] typing socket URL kept as is", error);
    return url;
  }
};

const messageType = (event: MessageEvent<unknown>): string | null => {
  if (typeof event.data !== "string") return null;
  try {
    const message: unknown = JSON.parse(event.data);
    if (typeof message !== "object" || message === null) return null;
    const type: unknown = Reflect.get(message, "type");
    return typeof type === "string" ? type : null;
  } catch {
    return null;
  }
};

/** What a typing listener sees: the open socket and the wave it follows. */
export interface TypingSocketSnapshot {
  readonly socket: WebSocket | null;
  readonly waveId: string | null;
}

const CLOSED_SNAPSHOT: TypingSocketSnapshot = { socket: null, waveId: null };

interface Consumer {
  readonly waveId: string;
}

class TypingSocket {
  private readonly consumers: Consumer[] = [];
  private readonly listeners = new Set<() => void>();
  private snapshot: TypingSocketSnapshot = CLOSED_SNAPSHOT;
  private appActive = true;
  private visibleSince: number | null = null;
  private ws: WebSocket | null = null;
  // The identity the socket authenticated (or is authenticating) as.
  private socketIdentity: string | null = null;
  // The token of the AUTHENTICATE in flight or last accepted; null when
  // anonymous or after a rejection.
  private sentToken: string | null = null;
  private authenticating = false;
  private ready = false;
  private subscribedWaveId: string | null = null;
  private rejectedToken: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private authenticationTimer: ReturnType<typeof setTimeout> | null = null;
  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private stopWatching: (() => void) | null = null;
  // Sockets this tab closed itself. Their close events, which a browser
  // delivers later, never schedule a reconnect.
  private readonly closedByClient = new WeakSet<WebSocket>();

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): TypingSocketSnapshot => this.snapshot;

  /** Asks for typing events of `waveId`; the newest request wins. */
  acquire(waveId: string): () => void {
    const consumer: Consumer = { waveId };
    this.consumers.push(consumer);
    this.reconcile();
    return () => {
      const index = this.consumers.indexOf(consumer);
      if (index >= 0) this.consumers.splice(index, 1);
      this.reconcile();
    };
  }

  /** A native app in the background holds no socket. */
  setAppActive(active: boolean): void {
    if (this.appActive === active) return;
    this.appActive = active;
    if (!active) this.close();
    this.reconcile();
  }

  private get desiredWaveId(): string | null {
    return this.consumers.at(-1)?.waveId ?? null;
  }

  private publish(): void {
    const waveId = this.ready ? this.subscribedWaveId : null;
    const socket = waveId === null ? null : this.ws;
    if (this.snapshot.socket === socket && this.snapshot.waveId === waveId) {
      return;
    }
    this.snapshot = socket === null ? CLOSED_SNAPSHOT : { socket, waveId };
    for (const listener of this.listeners) listener();
  }

  private reconcile(): void {
    const desired = this.desiredWaveId;
    if (desired === null) {
      this.clearOpenTimer();
      if (this.ws || this.reconnectTimer) this.scheduleClose();
      else this.unwatch();
      return;
    }
    this.clearCloseTimer();
    this.watch();
    if (!this.appActive) return;
    const token = getAuthJwt();
    if (token && !isAuthJwtUsable(token)) return;
    if (this.ws && this.socketIdentity !== getSocketIdentityKey(token)) {
      // Another identity reads other waves: start over as that identity.
      this.close();
      this.rejectedToken = null;
    }
    if (!this.ws) {
      if (this.isRejected(token)) return;
      if (!this.reconnectTimer) this.openWhenSettled();
      return;
    }
    this.subscribeTo(desired);
  }

  /** A rejected token is not retried until a newer one arrives. */
  private isRejected(token: string | null): boolean {
    return this.rejectedToken !== null && token === this.rejectedToken;
  }

  private openWhenSettled(): void {
    if (this.openTimer) return;
    if (document.visibilityState !== "visible") return;
    this.visibleSince ??= Date.now();
    const wait = this.visibleSince + OPEN_AFTER_VISIBLE_MS - Date.now();
    if (wait <= 0) {
      this.open();
      return;
    }
    this.openTimer = setTimeout(() => {
      this.openTimer = null;
      this.reconcile();
    }, wait);
  }

  private open(): void {
    const token = getAuthJwt();
    const ws = new WebSocket(getTypingSocketUrl(getWebSocketUrl()));
    this.ws = ws;
    this.socketIdentity = getSocketIdentityKey(token);
    this.sentToken = null;
    this.authenticating = false;
    this.ready = false;
    this.subscribedWaveId = null;
    const isCurrent = () => this.ws === ws;

    ws.onopen = () => {
      if (!isCurrent()) return;
      const openToken = getAuthJwt();
      if (getSocketIdentityKey(openToken) !== this.socketIdentity) {
        this.close();
        this.reconcile();
        return;
      }
      if (!openToken) {
        this.ready = true;
        this.reconnectAttempts = 0;
        this.reconcile();
        return;
      }
      this.authenticate(ws, openToken);
    };
    ws.onmessage = (event) => {
      if (!isCurrent() || this.sentToken === null) return;
      const type = messageType(event);
      if (type === "AUTHENTICATED") {
        this.authenticating = false;
        this.clearAuthenticationTimer();
        this.ready = true;
        this.reconnectAttempts = 0;
        this.reconcile();
        // The token may have rotated while this one was in flight.
        this.syncToken();
      } else if (type === "AUTHENTICATION_FAILED") {
        this.rejectedToken = this.sentToken;
        this.close(AUTHENTICATION_FAILED_CLOSE_CODE, "Authentication failed");
      }
    };
    ws.onclose = () => {
      if (!isCurrent() || this.closedByClient.has(ws)) return;
      this.dropSocket();
      if (
        this.desiredWaveId !== null &&
        !this.isRejected(getAuthJwt()) &&
        this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS
      ) {
        this.reconnectAttempts += 1;
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.reconcile();
        }, RECONNECT_DELAY_MS);
      }
    };
    ws.onerror = () => {
      if (isCurrent()) ws.close();
    };
  }

  private authenticate(ws: WebSocket, token: string): void {
    this.sentToken = token;
    this.authenticating = true;
    this.clearAuthenticationTimer();
    this.authenticationTimer = setTimeout(() => {
      this.authenticationTimer = null;
      if (this.ws === ws) {
        ws.close(AUTHENTICATION_TIMEOUT_CLOSE_CODE, "Authentication timeout");
      }
    }, AUTHENTICATION_TIMEOUT_MS);
    ws.send(JSON.stringify({ type: "AUTHENTICATE", access_token: token }));
  }

  /** Re-authenticates the open socket in place with a rotated token. */
  private syncToken(): void {
    const ws = this.ws;
    const latest = getAuthJwt();
    if (
      ws?.readyState !== WebSocket.OPEN ||
      !this.ready ||
      this.authenticating ||
      this.sentToken === null ||
      !latest ||
      latest === this.sentToken ||
      !isAuthJwtUsable(latest) ||
      getSocketIdentityKey(latest) !== this.socketIdentity
    ) {
      return;
    }
    this.authenticate(ws, latest);
  }

  private subscribeTo(waveId: string): void {
    const ws = this.ws;
    if (!ws || !this.ready || ws.readyState !== WebSocket.OPEN) return;
    if (this.subscribedWaveId !== waveId) {
      ws.send(
        JSON.stringify({
          type: WsMessageType.SUBSCRIBE_TO_WAVE,
          wave_id: waveId,
        })
      );
      this.subscribedWaveId = waveId;
    }
    this.publish();
  }

  private readonly onAuthChanged = (): void => {
    const token = getAuthJwt();
    if (
      this.rejectedToken !== null &&
      token &&
      token !== this.rejectedToken &&
      isAuthJwtUsable(token)
    ) {
      // A newer token for a rejected session gets a fresh attempt.
      this.rejectedToken = null;
      this.reconnectAttempts = 0;
    }
    if (this.ws && this.socketIdentity === getSocketIdentityKey(token)) {
      this.syncToken();
      return;
    }
    this.reconcile();
  };

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === "visible") {
      this.visibleSince ??= Date.now();
      this.reconcile();
      return;
    }
    this.visibleSince = null;
    this.clearOpenTimer();
  };

  private watch(): void {
    if (this.stopWatching) return;
    if (document.visibilityState === "visible") {
      this.visibleSince ??= Date.now();
    }
    const onAuthChanged = this.onAuthChanged;
    const onVisibilityChange = this.onVisibilityChange;
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, onAuthChanged);
    window.addEventListener("focus", onAuthChanged);
    window.addEventListener("storage", onAuthChanged);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    channel?.addEventListener("message", onAuthChanged);
    this.stopWatching = () => {
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, onAuthChanged);
      window.removeEventListener("focus", onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      channel?.removeEventListener("message", onAuthChanged);
      channel?.close();
    };
  }

  private unwatch(): void {
    this.stopWatching?.();
    this.stopWatching = null;
    this.visibleSince = null;
  }

  private scheduleClose(): void {
    if (this.closeTimer) return;
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      if (this.desiredWaveId !== null) return;
      this.close();
      this.rejectedToken = null;
      this.reconnectAttempts = 0;
      this.unwatch();
    }, CLOSE_AFTER_IDLE_MS);
  }

  /** Closes the socket and cancels its reconnect; consumers stay. */
  private close(code?: number, reason?: string): void {
    const ws = this.ws;
    if (ws) this.closedByClient.add(ws);
    this.clearReconnectTimer();
    this.dropSocket();
    if (code === undefined) ws?.close();
    else ws?.close(code, reason);
  }

  private dropSocket(): void {
    this.ws = null;
    this.socketIdentity = null;
    this.sentToken = null;
    this.authenticating = false;
    this.ready = false;
    this.subscribedWaveId = null;
    this.clearAuthenticationTimer();
    this.publish();
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private clearAuthenticationTimer(): void {
    if (this.authenticationTimer) clearTimeout(this.authenticationTimer);
    this.authenticationTimer = null;
  }

  private clearOpenTimer(): void {
    if (this.openTimer) clearTimeout(this.openTimer);
    this.openTimer = null;
  }

  private clearCloseTimer(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }
}

export const typingSocket = new TypingSocket();
