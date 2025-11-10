"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import type {
  SupportedChain,
  TokenRange,
} from "@/components/nft-picker/NftPicker.types";
import { parseTokenExpressionToRanges } from "@/components/nft-picker/NftPicker.utils";
import { VirtualizedTokenList } from "@/components/token-list/VirtualizedTokenList";

import {
  GrantItemContent,
  GrantItemError,
  GrantItemSkeleton,
} from "./subcomponents";
import { useGrantItemViewModel } from "./useGrantItemViewModel";

export interface UserPageXtdhGrantListItemProps {
  readonly grant: ApiTdhGrantsPage["data"][number];
}

export function UserPageXtdhGrantListItem({
  grant,
}: Readonly<UserPageXtdhGrantListItemProps>) {
  const {
    chain,
    contract,
    contractAddress,
    contractLabel,
    details,
    isLoading,
    status,
    variant,
  } = useGrantItemViewModel(grant);

  const tokenState = useMemo<TokenPanelState>(() => {
    if (!grant.target_tokens.length) {
      return { type: "all" };
    }
    try {
      const ranges = parseTokenExpressionToRanges(grant.target_tokens.join(","));
      if (!ranges.length) {
        return { type: "all" };
      }
      return { type: "list", ranges };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to parse granted tokens.";
      return { type: "error", message };
    }
  }, [grant.target_tokens]);

  if (isLoading) {
    return (
      <GrantListItemContainer>
        <GrantItemSkeleton />
      </GrantListItemContainer>
    );
  }

  return (
    <GrantListItemContainer>
      {variant === "contract" && contract ? (
        <GrantItemContent contract={contract} status={status} details={details} />
      ) : (
        <GrantItemError
          contractLabel={contractLabel}
          status={status}
          details={details}
        />
      )}
      <GrantTokensPanel
        chain={chain}
        contractAddress={contractAddress}
        grantId={grant.id}
        state={tokenState}
      />
    </GrantListItemContainer>
  );
}

function GrantListItemContainer({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <li className="tw-list-none tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      {children}
    </li>
  );
}

type TokenPanelState =
  | { type: "all" }
  | { type: "list"; ranges: TokenRange[] }
  | { type: "error"; message: string };

function GrantTokensPanel({
  chain,
  contractAddress,
  grantId,
  state,
}: Readonly<{
  chain: SupportedChain;
  contractAddress: `0x${string}` | null;
  grantId: string;
  state: TokenPanelState;
}>) {
  if (state.type === "error") {
    return (
      <div className="tw-mt-4 tw-rounded-lg tw-border tw-border-red-500/40 tw-bg-red-500/5 tw-p-3">
        <p className="tw-m-0 tw-text-sm tw-text-red-300">
          Unable to display granted tokens: {state.message}
        </p>
      </div>
    );
  }

  if (state.type === "all") {
    return (
      <div className="tw-mt-4 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-3">
        <p className="tw-m-0 tw-text-sm tw-text-iron-200">
          This grant applies to every token in the collection.
        </p>
      </div>
    );
  }

  return (
    <GrantTokensDisclosure
      chain={chain}
      contractAddress={contractAddress}
      grantId={grantId}
      ranges={state.ranges}
    />
  );
}

function GrantTokensDisclosure({
  chain,
  contractAddress,
  grantId,
  ranges,
}: Readonly<{
  chain: SupportedChain;
  contractAddress: `0x${string}` | null;
  grantId: string;
  ranges: TokenRange[];
}>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="tw-mt-4 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950">
      <button
        type="button"
        className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 tw-text-left"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
      >
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
            {isOpen ? "Hide granted tokens" : "Show granted tokens"}
          </span>
          <span className="tw-text-xs tw-text-iron-400">
            Expand to inspect the specific token IDs.
          </span>
        </div>
        <span
          aria-hidden="true"
          className="tw-text-lg tw-text-iron-300"
        >
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen ? (
        <div className="tw-border-t tw-border-iron-800 tw-p-3">
          <VirtualizedTokenList
            contractAddress={contractAddress ?? undefined}
            chain={chain}
            ranges={ranges}
            scrollKey={`grant-token-list-${grantId}`}
            className="tw-rounded-md tw-border tw-border-iron-800 tw-bg-iron-900"
            footerContent={null}
          />
        </div>
      ) : null}
    </div>
  );
}
