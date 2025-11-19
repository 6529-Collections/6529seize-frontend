"use client";

import { useMemo } from "react";

import { getTargetTokensCountInfo } from "@/components/user/xtdh/utils/xtdhGrantFormatters";

import {
  GrantItemContent,
  GrantItemError,
  GrantItemSkeleton,
} from "./subcomponents";
import { GrantListItemContainer } from "./subcomponents/GrantListItemContainer";
import { GrantTokensPanel } from "./subcomponents/GrantTokensPanel";
import type {
  TokenPanelState,
  UserPageXtdhGrantListItemProps,
} from "./types";
import { useGrantItemViewModel } from "./useGrantItemViewModel";

export type { UserPageXtdhGrantListItemProps } from "./types";

export function UserPageXtdhGrantListItem({
  grant,
}: Readonly<UserPageXtdhGrantListItemProps>) {
  const {
    chain,
    contract,
    contractAddress,
    contractLabel,
    details,
    errorDetails,
    isLoading,
    status,
    variant,
  } = useGrantItemViewModel(grant);

  const tokenState = useMemo<TokenPanelState>(() => {
    const info = getTargetTokensCountInfo(grant.target_tokens_count ?? null);

    if (info.kind === "all") {
      return { type: "all" };
    }

    if (info.kind === "count") {
      return { type: "count", label: info.label, count: info.count };
    }

    return { type: "unknown", label: info.label };
  }, [grant.target_tokens_count]);

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
        <GrantItemContent
          contract={contract}
          status={status}
          details={details}
          errorDetails={errorDetails}
        />
      ) : (
        <GrantItemError
          contractLabel={contractLabel}
          status={status}
          details={details}
          errorDetails={errorDetails}
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
