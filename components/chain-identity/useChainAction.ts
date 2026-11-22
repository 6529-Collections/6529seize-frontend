"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Hex } from "viem";
import type { ChainDraft } from "@/lib/chain-identity/gateway";
import {
  submitAndAwait,
  type ChainSigner,
} from "@/lib/chain-identity/operation";

/** Who pays the fee: the identity's balance or the signing wallet's. */
export type ChainFeePayer = "identity" | "wallet";

export type ChainActionState =
  | { readonly kind: "idle" }
  | { readonly kind: "preparing" }
  | {
      readonly kind: "confirm";
      readonly maxFee: bigint;
      readonly payer: ChainFeePayer;
      readonly keyType: 1 | 2;
    }
  | { readonly kind: "signingDocument" }
  | { readonly kind: "signing" }
  | { readonly kind: "sending" }
  | { readonly kind: "held" }
  | { readonly kind: "done" }
  | { readonly kind: "failed"; readonly error: unknown };

interface PreparedChainAction {
  readonly draft: ChainDraft;
  readonly signer: ChainSigner;
  readonly payer: ChainFeePayer;
  /**
   * What happens with the signature. Default: submit it alone and wait
   * until the change is final. A join holds the first signature instead.
   */
  readonly submit?: (draft: ChainDraft, signature: Hex) => Promise<void>;
  /** Runs once the change is final, before the action reads as done. */
  readonly afterFinal?: (draft: ChainDraft) => Promise<void> | void;
  /** The signature was held for another wallet's: the action ends "held". */
  readonly held?: boolean;
}

/**
 * One change on the 6529 Network, step by step: prepare (draft and check),
 * show the fee, sign, wait until final. The transaction is never signed
 * before the person has seen its fee and confirmed. A profile save also
 * has its document signed while it is prepared, right after the person
 * clicks save; `prepare` reports that step so the page can say so.
 */
export function useChainAction(onDone?: () => void) {
  const [state, setState] = useState<ChainActionState>({ kind: "idle" });
  const prepared = useRef<PreparedChainAction | null>(null);
  const mounted = useRef(true);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const update = useCallback((next: ChainActionState) => {
    if (mounted.current) {
      setState(next);
    }
  }, []);

  const prepare = useCallback(
    /** `make` gives null when there turns out to be nothing to sign. */
    async (
      make: (progress: {
        readonly walletPrompt: () => void;
        readonly preparing: () => void;
      }) => Promise<PreparedChainAction | null>
    ) => {
      prepared.current = null;
      update({ kind: "preparing" });
      try {
        const action = await make({
          walletPrompt: () => update({ kind: "signingDocument" }),
          preparing: () => update({ kind: "preparing" }),
        });
        if (action === null) {
          update({ kind: "idle" });
          return;
        }
        prepared.current = action;
        update({
          kind: "confirm",
          maxFee: BigInt(action.draft.fee.maxFee),
          payer: action.payer,
          keyType: action.signer.keyType,
        });
      } catch (error) {
        update({ kind: "failed", error });
      }
    },
    [update]
  );

  const confirm = useCallback(async () => {
    const action = prepared.current;
    if (!action) {
      return;
    }
    prepared.current = null;
    update({ kind: "signing" });
    try {
      const sig = await action.signer.sign(action.draft);
      update({ kind: "sending" });
      if (action.submit) {
        await action.submit(action.draft, sig);
      } else {
        await submitAndAwait(action.draft, [
          { role: 0, keyType: action.signer.keyType, sig },
        ]);
      }
      await action.afterFinal?.(action.draft);
      update({ kind: action.held === true ? "held" : "done" });
      onDoneRef.current?.();
    } catch (error) {
      update({ kind: "failed", error });
    }
  }, [update]);

  const cancel = useCallback(() => {
    prepared.current = null;
    update({ kind: "idle" });
  }, [update]);

  const busy =
    state.kind === "preparing" ||
    state.kind === "signingDocument" ||
    state.kind === "signing" ||
    state.kind === "sending";

  return { state, prepare, confirm, cancel, busy } as const;
}
