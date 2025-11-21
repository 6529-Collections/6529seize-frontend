"use client";

import { useMemo } from "react";

import {
  GrantItemContent,
  GrantItemError,
  GrantItemSkeleton,
} from "./subcomponents";
import { mapTokenCountToState } from "./formatters";
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

  const tokenState = useMemo<TokenPanelState>(
    () => mapTokenCountToState(grant.target_tokens_count ?? null),
    [grant.target_tokens_count]
  );

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
