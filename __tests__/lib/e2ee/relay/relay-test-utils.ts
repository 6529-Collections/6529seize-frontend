import type {
  CrpOpener,
  CrpTransport,
  RelayGrantProof,
} from "@/lib/e2ee/relay/crp-client";
import { decodeRecordContent } from "@/lib/e2ee/relay/record-content";
import {
  contentRefOf,
  type RelayItem,
  sha256Hex,
} from "@/lib/e2ee/relay/relay-records";
import vectors from "./relay-records-v1.json";
import more from "./relay-records-v1-more.json";

/**
 * Records the backend's orderer wrote (its publisher and mock relay), so
 * these tests check the browser against the bytes the server produces.
 */
export const RELAY_VECTORS = vectors as unknown as {
  readonly net: string;
  readonly relay_head: number;
  readonly orderer_key: string;
  readonly orderer_grant: RelayGrantProof;
  readonly group: string;
  readonly device: string;
  readonly other: string;
  readonly blob: string;
  readonly items: RelayItem[];
  readonly payloads: Record<string, string>;
};

/**
 * More records from the same orderer: each device's own record (`dr`), and
 * the inbox of a device whose first Welcome was acked and then DEL'd (the
 * relay serves that record no more; it serves the DEL), and the inbox of a
 * revoked device.
 */
export const MORE_VECTORS = more as unknown as {
  readonly device_with_del: string;
  readonly revoked_device: string;
  readonly welcomes: {
    readonly acked: string;
    readonly pending: string;
    readonly of_revoked: string;
  };
  readonly items: RelayItem[];
};

/** Every record the test relay serves. */
export const ALL_ITEMS: readonly RelayItem[] = [
  ...RELAY_VECTORS.items,
  ...MORE_VECTORS.items,
];

/** A stream's head as 6529.io would name it: its newest record served. */
export async function streamHead(
  wave: string,
  items: readonly RelayItem[] = ALL_ITEMS
): Promise<{ pos: number; hash: string }> {
  const records = items.filter(
    (item) => item.event.wave === wave && contentRefOf(item.event)
  );
  const newest = records[records.length - 1]!;
  const bytes = contentRefOf(newest.event)!.inline!;
  return {
    pos: decodeRecordContent(bytes).pos,
    hash: await sha256Hex(bytes),
  };
}

function binaryFrame(header: object, bytes: Uint8Array): Uint8Array {
  const head = new TextEncoder().encode(JSON.stringify(header));
  const out = new Uint8Array(4 + head.length + bytes.length);
  new DataView(out.buffer).setUint32(0, head.length, false);
  out.set(head, 4);
  out.set(bytes, 4 + head.length);
  return out;
}

export interface FakeRelay {
  readonly open: CrpOpener;
  readonly requests: Record<string, number>;
  readonly items: RelayItem[];
  readonly payloads: Map<string, Uint8Array>;
  down: boolean;
}

/** A relay serving the vectors over CRP: HELLO, AUTH, HIST, PAYLOAD_GET. */
export function fakeRelay(items: readonly RelayItem[] = ALL_ITEMS): FakeRelay {
  const relay: FakeRelay = {
    requests: {},
    items: [...items],
    payloads: new Map(
      Object.entries(RELAY_VECTORS.payloads).map(([sha, b64]) => [
        sha,
        Uint8Array.from(Buffer.from(b64, "base64")),
      ])
    ),
    down: false,
    open: async () => {
      if (relay.down) throw new Error("down");
      const listeners: ((data: string | Uint8Array) => void)[] = [];
      const reply = (data: string | Uint8Array) =>
        setTimeout(() => listeners.forEach((listener) => listener(data)), 0);
      const transport: CrpTransport = {
        send: (data) => {
          const frame = JSON.parse(data) as Record<string, unknown>;
          const type = String(frame["t"]);
          relay.requests[type] = (relay.requests[type] ?? 0) + 1;
          if (type === "HELLO") {
            reply(
              JSON.stringify({
                t: "WELCOME",
                v: 1,
                relay_id: "relay-test",
                log_epoch: 1,
                net: frame["net"],
              })
            );
            reply(
              JSON.stringify({ t: "CHALLENGE", nonce: `0x${"07".repeat(32)}` })
            );
          } else if (type === "AUTH") {
            reply(
              JSON.stringify({ t: "AUTHED", rid: frame["rid"], roles: [] })
            );
          } else if (type === "HIST") {
            const wave = String(frame["wave"]);
            const after = Number(frame["after"]);
            const limit = Number(frame["limit"]);
            const matching = relay.items.filter(
              (item) => item.event.wave === wave && item.rseq > after
            );
            reply(
              JSON.stringify({
                t: "RES",
                rid: frame["rid"],
                items: matching.slice(0, limit),
                more: matching.length > limit,
              })
            );
          } else if (type === "PAYLOAD_GET") {
            const bytes = relay.payloads.get(String(frame["sha256"]));
            reply(
              bytes
                ? binaryFrame({ t: "PAYLOAD", rid: frame["rid"] }, bytes)
                : JSON.stringify({
                    t: "ERR",
                    rid: frame["rid"],
                    reason: "not found",
                  })
            );
          }
        },
        close: () => undefined,
        onMessage: (listener) => listeners.push(listener),
        onClose: () => undefined,
      };
      return transport;
    },
  };
  return relay;
}

export const TEST_AUTH = {
  grant: RELAY_VECTORS.orderer_grant,
  sign: async () => `0x${"11".repeat(64)}`,
};
