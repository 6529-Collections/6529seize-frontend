"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { commonApiPost } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiTdhGrantStatus } from "@/generated/models/ApiTdhGrantStatus";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import { useAuth } from "@/components/auth/Auth";
import CommonConfirmationModal from "@/components/utils/modal/CommonConfirmationModal";

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
    validFrom,
    validTo,
  } = useGrantItemViewModel(grant);

  const queryClient = useQueryClient();
  const { setToast } = useAuth();

  const [activeModal, setActiveModal] = useState<"STOP" | "REVOKE" | null>(
    null
  );

  const stopGrant = useMutation({
    mutationFn: async () => {
      await commonApiPost({
        endpoint: `tdh-grants/${grant.id}`,
        body: {
          valid_to: Date.now(),
        },
      });
    },
    onSuccess: () => {
      setToast({
        type: "success",
        message: "Grant stopped successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [QueryKey.TDH_GRANTS] });
      setActiveModal(null);
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
      setActiveModal(null);
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
          onClicked={() => setActiveModal("STOP")}
          disabled={stopGrant.isPending || revokeGrant.isPending}
          loading={stopGrant.isPending}
          size="sm"
        >
          Stop
        </SecondaryButton>
        <SecondaryButton
          onClicked={() => setActiveModal("REVOKE")}
          disabled={stopGrant.isPending || revokeGrant.isPending}
          loading={revokeGrant.isPending}
          size="sm"
          className="!tw-text-red-400 hover:!tw-text-red-300 hover:!tw-border-red-500/50 hover:!tw-bg-red-500/10"
        >
          Revoke
        </SecondaryButton>
      </div>
    );
  }, [isSelf, status, stopGrant.isPending, revokeGrant.isPending]);

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
          validFrom={validFrom}
          validTo={validTo}
        />
      ) : (
        <GrantItemError
          contractLabel={contractLabel}
          status={status}
          details={details}
          errorDetails={errorDetails}
          validFrom={validFrom}
          validTo={validTo}
        />
      )}
      <GrantTokensPanel
        chain={chain}
        contractAddress={contractAddress}
        grantId={grant.id}
        state={tokenState}
      />
      <CommonConfirmationModal
        isOpen={activeModal === "STOP"}
        onClose={() => setActiveModal(null)}
        onConfirm={() => stopGrant.mutate()}
        title="Stop Grant"
        message="Are you sure you want to stop this grant? It will expire immediately."
        confirmText="Stop"
        isConfirming={stopGrant.isPending}
        confirmButtonClass="tw-cursor-pointer tw-bg-[#F04438] tw-border-[#F04438] hover:tw-bg-[#D92D20] hover:tw-border-[#D92D20]"
        icon={
          <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-red/10 tw-border tw-border-solid tw-border-red/10">
            <svg
              className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-red tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M10 11.5V16.5M14 11.5V16.5M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        }
      />
      <CommonConfirmationModal
        isOpen={activeModal === "REVOKE"}
        onClose={() => setActiveModal(null)}
        onConfirm={() => revokeGrant.mutate()}
        title="Revoke Grant"
        message="Are you sure you want to revoke this grant? It will be treated as if it never existed."
        confirmText="Revoke"
        isConfirming={revokeGrant.isPending}
        confirmButtonClass="tw-cursor-pointer tw-bg-[#F04438] tw-border-[#F04438] hover:tw-bg-[#D92D20] hover:tw-border-[#D92D20]"
        icon={
          <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-red/10 tw-border tw-border-solid tw-border-red/10">
            <svg
              className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-red tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M10 11.5V16.5M14 11.5V16.5M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        }
      />
    </GrantListItemContainer>
  );
}
