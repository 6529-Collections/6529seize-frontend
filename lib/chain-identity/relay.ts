import type { Hex } from "viem";
import {
  commonApiDeleteWithResponse,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";
import type { ChainDraft, ChainTypedData } from "./gateway";

/**
 * 6529.io's relay for operations that need more than one wallet's signature
 * (`/api/chain/pending`). A wallet joining an identity signs IDENTITY_JOIN
 * after the identity's wallet. The relay holds the draft and the first
 * signature until the joining wallet signs, on any device, then sends both
 * to the 6529 Network. Every call needs a signed-in wallet, and the relay
 * checks each signature against its signer before it keeps it.
 */

type RelayStatus = "PENDING" | "SUBMITTED" | "FAILED" | "CANCELLED";

interface RelaySignature {
  readonly role: number;
  readonly key_type: number;
  readonly sig: Hex;
}

export interface RelayOperation {
  readonly tx_id: Hex;
  readonly op_type: string | number;
  readonly principal: Hex | null;
  readonly unsigned: Hex;
  readonly typed_data: ChainTypedData;
  readonly created_by: string;
  /** Unix ms: the draft's expiresAt. */
  readonly expires_at: number;
  readonly status: RelayStatus;
  /** Why the 6529 Network refused it, or why it couldn't be reached. */
  readonly last_error: string | null;
  readonly signers: readonly {
    readonly role: number;
    readonly key_type: number;
    readonly signer: Hex;
    readonly signed: boolean;
  }[];
}

/** An answer from 6529.io's relay that wasn't a success. */
export class ChainRelayError extends Error {
  constructor(
    /** The HTTP status; 0 when 6529.io didn't answer. */
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ChainRelayError";
  }
}

const relayError = (error: unknown): ChainRelayError => {
  const status = (error as { status?: unknown } | null)?.status;
  return new ChainRelayError(
    typeof status === "number" ? status : 0,
    error instanceof Error ? error.message : String(error)
  );
};

/** Runs one relay call; any failure is a ChainRelayError. */
async function relayCall<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw relayError(error);
  }
}

const pendingPath = (txId?: Hex, action?: "signatures" | "retry") =>
  ["chain/pending", txId?.toLowerCase(), action].filter(Boolean).join("/");

const toNumber = (value: unknown): number =>
  typeof value === "number" ? value : Number(value);

export const chainRelay = {
  /**
   * Holds a checked draft that this wallet has signed, until the draft's
   * other signers sign. The signers are the draft's own list.
   */
  hold: (draft: ChainDraft, signatures: readonly RelaySignature[]) =>
    relayCall(() =>
      commonApiPost<unknown, RelayOperation>({
        endpoint: pendingPath(),
        errorMode: "structured",
        body: {
          tx_id: draft.txId.toLowerCase(),
          op_type: draft.opName ?? draft.opType,
          principal:
            (
              draft.envelope.header["principal"] as Hex | undefined
            )?.toLowerCase() ?? null,
          unsigned: draft.unsigned,
          typed_data: draft.typedData,
          expires_at: toNumber(draft.envelope.header["expiresAt"]),
          required: draft.signatures.map((entry) => ({
            role: entry.role,
            key_type: entry.keyType,
            signer: entry.signer?.toLowerCase(),
          })),
          signatures,
        },
      })
    ),

  /** Operations waiting for the signed-in wallet's signature. */
  waiting: async (signal?: AbortSignal): Promise<readonly RelayOperation[]> =>
    (
      await relayCall(() =>
        commonApiFetch<{ readonly data?: readonly RelayOperation[] }>({
          endpoint: pendingPath(),
          errorMode: "structured",
          signal,
        })
      )
    ).data ?? [],

  get: (txId: Hex, signal?: AbortSignal) =>
    relayCall(() =>
      commonApiFetch<RelayOperation>({
        endpoint: pendingPath(txId),
        errorMode: "structured",
        signal,
      })
    ),

  /** Adds the signed-in wallet's signature; the relay sends it once complete. */
  sign: (txId: Hex, signature: RelaySignature) =>
    relayCall(() =>
      commonApiPost<RelaySignature, RelayOperation>({
        endpoint: pendingPath(txId, "signatures"),
        errorMode: "structured",
        body: signature,
      })
    ),

  /** Sends a complete operation again after the 6529 Network was unreachable. */
  retry: (txId: Hex) =>
    relayCall(() =>
      commonApiPost<Record<string, never>, RelayOperation>({
        endpoint: pendingPath(txId, "retry"),
        errorMode: "structured",
        body: {},
      })
    ),

  /** A signer or the wallet that started it cancels it. */
  cancel: (txId: Hex) =>
    relayCall(() =>
      commonApiDeleteWithResponse<RelayOperation>({
        endpoint: pendingPath(txId),
        errorMode: "structured",
      })
    ),
};
