"use client";

import { useEffect, useRef, useState } from "react";
import type { TransactionReceipt } from "viem";

import Button from "@/components/utils/button/Button";
import type { ButtonVariant } from "@/components/utils/button/buttonStyles";

import { keepTxResult } from "./txResults";
import { TxStatus } from "./TxStatus";
import { useStreamTx, type TxRequest } from "./useStreamTx";

/**
 * A transaction button with its one-line "what this does and costs" above it
 * and its status below it. Anyone may press most Stream buttons, so this is
 * used for start, settle, restart and claim as well as for bids.
 */
export function TxAction({
  label,
  description,
  request,
  disabled = false,
  variant = "action",
  fullWidth = false,
  onDone,
  doneText,
}: {
  readonly label: string;
  readonly description?: string | undefined;
  readonly request: () => TxRequest | null | Promise<TxRequest | null>;
  readonly disabled?: boolean | undefined;
  readonly variant?: ButtonVariant | undefined;
  readonly fullWidth?: boolean | undefined;
  readonly onDone?: ((receipt: TransactionReceipt) => void) | undefined;
  /** What happened, said after the transaction lands. */
  readonly doneText?: string | undefined;
}) {
  const { state, send } = useStreamTx();
  // A request that cannot be built (a read failed) is reported like a failed send.
  const [buildFailed, setBuildFailed] = useState(false);
  // The result line is fixed when pressed: after the transaction the page refetches,
  // and amounts it was built from (a balance, a minimum) change.
  const [pressedDoneText, setPressedDoneText] = useState<string | undefined>(undefined);
  // A finished transaction whose button leaves the page (the screen moved on)
  // hands its result line to the page-level bar instead of losing it.
  const mounted = useRef(true);
  const landed = useRef<{ text: string | undefined; hash: TransactionReceipt["transactionHash"] } | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (landed.current) keepTxResult(landed.current.text, landed.current.hash);
    };
  }, []);
  const busy = state.phase === "wallet" || state.phase === "pending" || state.phase === "slow";
  return (
    <div>
      {description ? (
        <p className="tw-mb-2 tw-mt-0 tw-text-sm tw-text-iron-400">{description}</p>
      ) : null}
      <Button
        variant={variant}
        size="md"
        fullWidth={fullWidth}
        loading={busy}
        disabled={disabled || busy}
        onClick={async () => {
          setBuildFailed(false);
          setPressedDoneText(doneText);
          landed.current = null;
          const pressedText = doneText;
          let next;
          try {
            next = await request();
          } catch {
            next = null;
          }
          if (!next) {
            setBuildFailed(true);
            return;
          }
          const receipt = await send(next);
          if (!receipt) return;
          if (mounted.current) landed.current = { text: pressedText, hash: receipt.transactionHash };
          else keepTxResult(pressedText, receipt.transactionHash);
          onDone?.(receipt);
        }}
      >
        {label}
      </Button>
      <TxStatus state={buildFailed ? { phase: "error", error: "other" } : state} doneText={pressedDoneText} />
    </div>
  );
}
