"use client";

import { useState, useMemo, useContext } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { commonApiPost } from "@/services/api/common-api";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { useAuth } from "@/components/auth/Auth";
import CommonConfirmationModal from "@/components/utils/modal/CommonConfirmationModal";
import { GrantOwnerActions } from "./subcomponents/GrantOwnerActions";

import {
  GrantItemContent,
  GrantItemError,
  GrantItemSkeleton,
} from "./subcomponents";
import { mapTokenCountToState } from "./formatters";
import { GrantListItemContainer } from "./subcomponents/GrantListItemContainer";
import { GrantTokensPanel } from "./subcomponents/GrantTokensPanel";
import type { TokenPanelState, UserPageXtdhGrantListItemProps } from "./types";
import { useGrantItemViewModel } from "./useGrantItemViewModel";

export function UserPageXtdhGrantListItem({
  grant,
  isSelf,
  contractOverviewState,
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
  } = useGrantItemViewModel(grant, contractOverviewState);

  const queryClient = useQueryClient();
  const { invalidateIdentityTdhStats } = useContext(ReactQueryWrapperContext);
  const { setToast } = useAuth();

  const [activeModal, setActiveModal] = useState<"STOP" | "REVOKE" | null>(
    null
  );

  function handleGrantMutationSuccess(message: string): void {
    setToast({
      type: "success",
      message,
    });
    queryClient
      .invalidateQueries({ queryKey: [QueryKey.TDH_GRANTS] })
      .catch(() => undefined);
    const identity = grant.grantor.handle ?? grant.grantor.primary_address;
    if (identity) {
      invalidateIdentityTdhStats({ identity });
    }
    setActiveModal(null);
  }

  const stopGrant = useMutation({
    mutationFn: async () => {
      await commonApiPost({
        endpoint: `xtdh/grants/${grant.id}`,
        body: {
          valid_to: Date.now(),
        },
      });
    },
    onSuccess: () => {
      handleGrantMutationSuccess("Grant stopped.");
    },
    onError: () => {
      setToast({
        type: "error",
        message: "Couldn't stop this grant. Please try again.",
      });
    },
  });

  const revokeGrant = useMutation({
    mutationFn: async () => {
      await commonApiPost({
        endpoint: `xtdh/grants/${grant.id}`,
        body: {
          valid_to: grant.valid_from,
        },
      });
    },
    onSuccess: () => {
      handleGrantMutationSuccess("Grant revoked.");
    },
    onError: () => {
      setToast({
        type: "error",
        message: "Couldn't revoke this grant. Please try again.",
      });
    },
  });

  const tokenState = useMemo<TokenPanelState>(
    () => mapTokenCountToState(grant.target_tokens_count),
    [grant.target_tokens_count]
  );

  const canManage =
    isSelf &&
    (status === ApiXTdhGrantStatus.Pending ||
      status === ApiXTdhGrantStatus.Granted);
  const actions = canManage ? (
    <GrantOwnerActions
      isStopping={stopGrant.isPending}
      isRevoking={revokeGrant.isPending}
      onStop={() => setActiveModal("STOP")}
      onRevoke={() => setActiveModal("REVOKE")}
    />
  ) : null;

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
        message="This grant will be stopped immediately. All previously granted TDH will remain untouched."
        confirmText="Stop Grant"
        isConfirming={stopGrant.isPending}
        confirmVariant="tertiary"
        icon={
          <span className="tw-inline-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800">
            <svg
              className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-text-iron-300"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z"
                clipRule="evenodd"
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
        message="This grant will be revoked. All granted TDH will be removed as if the grant never existed."
        confirmText="Revoke Grant"
        isConfirming={revokeGrant.isPending}
        confirmVariant="destructive"
        icon={
          <span className="tw-inline-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-red/10 tw-bg-red/10">
            <svg
              className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-text-red tw-transition tw-duration-300 tw-ease-out"
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
