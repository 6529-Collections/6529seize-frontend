"use client";

import type { SupportedChain } from "@/components/nft-picker/NftPicker.types";

import type { TokenPanelState } from "../types";

import { GrantTokensDisclosure } from "./GrantTokensDisclosure";

interface GrantTokensPanelProps {
  readonly chain: SupportedChain | null;
  readonly contractAddress: `0x${string}` | null;
  readonly grantId: string;
  readonly state: TokenPanelState;
}

export function GrantTokensPanel({
  chain,
  contractAddress,
  grantId,
  state,
}: Readonly<GrantTokensPanelProps>) {
  if (state.type === "all") {
    return (
      <div className="tw-mt-4 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-3">
        <p className="tw-m-0 tw-text-sm tw-text-iron-200">
          This grant applies to every token in the collection.
        </p>
      </div>
    );
  }

  const tokensCount = state.type === "count" ? state.count : null;

  return (
    <GrantTokensDisclosure
      chain={chain}
      contractAddress={contractAddress}
      grantId={grantId}
      tokensCount={tokensCount}
      tokensCountLabel={state.label}
    />
  );
}
