"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { commonApiPost } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiTdhGrantStatus } from "@/generated/models/ApiTdhGrantStatus";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import { useAuth } from "@/components/auth/Auth";

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
  isSelf,
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

  const queryClient = useQueryClient();
  const { setToast } = useAuth();

  const stopGrant = useMutation({
    mutationFn: async () => {
      await commonApiPost({
        endpoint: `tdh-grants/${grant.id}`,
        body: {
          valid_to: Math.floor(Date.now() / 1000),
        },
      });
    },
    onSuccess: () => {
      setToast({
        type: "success",
        message: "Grant stopped successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [QueryKey.TDH_GRANTS] });
    },
    onError: () => {
      setToast({
        type: "error",
        message: "Failed to stop grant.",
      });
    },
  });

  const revokeGrant = useMutation({
    mutationFn: async () => {
      await commonApiPost({
        endpoint: `tdh-grants/${grant.id}`,
        body: {
          valid_to: grant.valid_from,
        },
      });
    },
    onSuccess: () => {
      setToast({
        type: "success",
        message: "Grant revoked successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [QueryKey.TDH_GRANTS] });
    },
    onError: () => {
      setToast({
        type: "error",
        message: "Failed to revoke grant.",
      });
    },
  });

  const tokenState = useMemo<TokenPanelState>(
    () => mapTokenCountToState(grant.target_tokens_count ?? null),
    [grant.target_tokens_count]
  );

  const actions = useMemo(() => {
    if (!isSelf) {
      return null;
    }

    const isPending = status === ApiTdhGrantStatus.Pending;
    const isActive = status === ApiTdhGrantStatus.Granted;

    if (!isPending && !isActive) {
      return null;
    }

    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <SecondaryButton
          onClicked={() => stopGrant.mutate()}
          disabled={stopGrant.isPending || revokeGrant.isPending}
          loading={stopGrant.isPending}
          size="sm"
        >
          Stop
        </SecondaryButton>
        <SecondaryButton
          onClicked={() => revokeGrant.mutate()}
          disabled={stopGrant.isPending || revokeGrant.isPending}
          loading={revokeGrant.isPending}
          size="sm"
          className="!tw-text-red-400 hover:!tw-text-red-300 hover:!tw-border-red-500/50 hover:!tw-bg-red-500/10"
        >
          Revoke
        </SecondaryButton>
      </div>
    );
  }, [isSelf, status, stopGrant, revokeGrant]);

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
          actions={actions}
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
