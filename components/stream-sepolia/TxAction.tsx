"use client";

import Button from "@/components/utils/button/Button";
import type { ButtonVariant } from "@/components/utils/button/buttonStyles";

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
}: {
  readonly label: string;
  readonly description?: string | undefined;
  readonly request: () => TxRequest | null | Promise<TxRequest | null>;
  readonly disabled?: boolean | undefined;
  readonly variant?: ButtonVariant | undefined;
  readonly fullWidth?: boolean | undefined;
  readonly onDone?: (() => void) | undefined;
}) {
  const { state, send } = useStreamTx();
  const busy = state.phase === "wallet" || state.phase === "pending";
  return (
    <div>
      {description ? (
        <p className="tw-mb-2 tw-mt-0 tw-text-sm tw-text-iron-400">{description}</p>
      ) : null}
      <Button
        variant={variant}
        size="lg"
        fullWidth={fullWidth}
        loading={busy}
        disabled={disabled || busy}
        onClick={async () => {
          const next = await request();
          if (!next) return;
          const receipt = await send(next);
          if (receipt) onDone?.();
        }}
      >
        {label}
      </Button>
      <TxStatus state={state} />
    </div>
  );
}
