/**
 * A `GatewayTransport` over HTTP, speaking wire format v0 (`wire.ts`).
 *
 * GW1: submission carries no login, cookie or token; the transaction
 * authenticates itself, so requests go out with `credentials: "omit"`.
 */
import type { Hex } from "viem";

import type { GatewayRef } from "../status-ladder";
import type { CheckTxAnswer, GatewayHead, GatewayTransport, TxLocation } from "./transport";
import { parseCheckTxAnswer, parseGatewayHead, parseTxLocation } from "./wire";

export interface HttpGatewayOptions {
  readonly ref: GatewayRef;
  /** The gateway's base URL; v0 routes resolve below it. */
  readonly baseUrl: string;
  readonly fetch?: typeof fetch;
  /** Per-request timeout; a timed-out gateway counts as silent. */
  readonly timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 8_000;
const HASH_RE = /^0x[0-9a-f]{64}$/;

function joinUrl(base: string, path: string): string {
  const prefix = base.endsWith("/") ? base : base + "/";
  return prefix + path;
}

/**
 * A signal that aborts on timeout or when `outer` aborts, and a disposer
 * that clears the timer (no AbortSignal.any: older Safari lacks it).
 */
function requestSignal(
  timeoutMs: number,
  outer: AbortSignal | undefined
): { readonly signal: AbortSignal; readonly dispose: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("gateway timeout")), timeoutMs);
  const onOuterAbort = (): void => controller.abort(outer?.reason);
  if (outer?.aborted === true) {
    controller.abort(outer.reason);
  } else {
    outer?.addEventListener("abort", onOuterAbort, { once: true });
  }
  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      outer?.removeEventListener("abort", onOuterAbort);
    },
  };
}

export function createHttpGatewayTransport(options: HttpGatewayOptions): GatewayTransport {
  const doFetch = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function json(path: string, init: RequestInit, signal?: AbortSignal): Promise<unknown> {
    const request = requestSignal(timeoutMs, signal);
    try {
      const response = await doFetch(joinUrl(options.baseUrl, path), {
        ...init,
        credentials: "omit",
        cache: "no-store",
        signal: request.signal,
      });
      if (!response.ok) {
        throw new Error(`gateway ${options.ref.id} answered HTTP ${response.status}`);
      }
      return (await response.json()) as unknown;
    } finally {
      request.dispose();
    }
  }

  return {
    ref: options.ref,
    async submit(tx: Uint8Array, signal?: AbortSignal): Promise<CheckTxAnswer> {
      const body = new Uint8Array(tx);
      const answer = await json(
        "v0/tx",
        {
          method: "POST",
          headers: { "content-type": "application/octet-stream" },
          body,
        },
        signal
      );
      return parseCheckTxAnswer(answer);
    },
    async locate(txId: Hex, signal?: AbortSignal): Promise<TxLocation> {
      const id = txId.toLowerCase();
      if (!HASH_RE.test(id)) {
        throw new Error("txId must be a 32-byte hash");
      }
      return parseTxLocation(await json(`v0/tx/${id}`, { method: "GET" }, signal));
    },
    async head(signal?: AbortSignal): Promise<GatewayHead> {
      return parseGatewayHead(await json("v0/head", { method: "GET" }, signal));
    },
  };
}
