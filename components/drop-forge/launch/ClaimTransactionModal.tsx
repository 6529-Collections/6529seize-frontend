"use client";

import type { Chain } from "viem";
import OnchainTransactionModal from "@/components/common/OnchainTransactionModal";
import type { ClaimTxModalState } from "@/components/drop-forge/launch/launch-claim-derived-state";

export default function ClaimTransactionModal({
  state,
  chain,
  onClose,
}: Readonly<{
  state: ClaimTxModalState | null;
  chain: Chain;
  onClose: () => void;
}>) {
  if (!state) return null;

  return (
    <OnchainTransactionModal
      status={state.status}
      title={state.actionLabel ?? "Onchain Action"}
      message={state.message}
      transactionHash={state.txHash}
      chain={chain}
      onClose={onClose}
    />
  );
}
