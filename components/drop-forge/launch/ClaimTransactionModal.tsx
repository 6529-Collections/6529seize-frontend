"use client";

import type { Chain } from "viem";
import OnchainTransactionModal from "@/components/common/OnchainTransactionModal";
import type { ClaimTxModalState } from "@/components/drop-forge/launch/launch-claim-derived-state";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString, formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

export default function ClaimTransactionModal({
  state,
  chain,
  onClose,
  showAirdropSummary = false,
}: Readonly<{
  state: ClaimTxModalState | null;
  chain: Chain;
  onClose: () => void;
  showAirdropSummary?: boolean;
}>) {
  const locale = useBrowserLocale();
  if (!state) return null;

  return (
    <OnchainTransactionModal
      status={state.status}
      title={state.actionLabel ?? "Onchain Action"}
      subtitle={
        showAirdropSummary && state.airdrop
          ? t(locale, "dropForge.airdrop.summary", {
              quantity: formatDecimalString(locale, state.airdrop.quantity),
              wallets: formatInteger(locale, state.airdrop.walletCount),
            })
          : undefined
      }
      message={state.message}
      transactionHash={state.txHash}
      chain={chain}
      onClose={onClose}
    />
  );
}
