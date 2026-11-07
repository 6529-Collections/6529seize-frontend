import { scheduleStaggered } from "@/helpers/jitter.helpers";
import { WEBSOCKET_RECONNECT_RESYNC_STAGGER_MAX_MS } from "./WebSocketTypes";

/**
 * When a socket consumer resyncs: on the first connection, after every
 * reconnect and on the server's `RESYNC_REQUIRED`. Every client reconnects
 * together after a deploy, so all but the first run are staggered; a
 * disconnect cancels a pending one.
 */
export class ReconnectResyncSchedule {
  private wasConnected = false;
  private hasConnected = false;
  private cancelPending: (() => void) | null = null;
  private readonly onNextConnect = new Set<() => void>();

  /**
   * Runs `task` when the socket next connects, before that connection's own
   * resync, so the resync can join what it starts. Returns a cancel.
   */
  runOnNextConnect(task: () => void): () => void {
    this.onNextConnect.add(task);
    return () => {
      this.onNextConnect.delete(task);
    };
  }

  /** Call with the socket's state whenever it may have changed. */
  update(connected: boolean, resync: () => unknown): void {
    const wasConnected = this.wasConnected;
    this.wasConnected = connected;
    if (!connected) {
      this.cancel();
      return;
    }
    if (wasConnected) {
      return;
    }
    const tasks = [...this.onNextConnect];
    this.onNextConnect.clear();
    for (const task of tasks) task();
    const isReconnect = this.hasConnected;
    this.hasConnected = true;
    if (isReconnect) {
      this.schedule(resync);
    } else {
      void resync();
    }
  }

  /** Schedules a staggered resync, replacing a pending one. */
  schedule(resync: () => unknown): void {
    this.cancel();
    this.cancelPending = scheduleStaggered(() => {
      this.cancelPending = null;
      void resync();
    }, WEBSOCKET_RECONNECT_RESYNC_STAGGER_MAX_MS);
  }

  cancel(): void {
    this.cancelPending?.();
    this.cancelPending = null;
  }
}
