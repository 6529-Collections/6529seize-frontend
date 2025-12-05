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
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";

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
  const { invalidateIdentityTdhStats } = useContext(ReactQueryWrapperContext);
  const { setToast } = useAuth();

  const [activeModal, setActiveModal] = useState<"STOP" | "REVOKE" | null>(
    null
  );

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
      setToast({
        type: "success",
        message: "Grant stopped successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [QueryKey.TDH_GRANTS] });
      const identity = grant.grantor.handle ?? grant.grantor.primary_address;
      if (identity) {
        invalidateIdentityTdhStats({ identity });
      }
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
        endpoint: `xtdh/grants/${grant.id}`,
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
      const identity = grant.grantor.handle ?? grant.grantor.primary_address;
      if (identity) {
        invalidateIdentityTdhStats({ identity });
      }
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

    const isPending = status === ApiXTdhGrantStatus.Pending;
    const isActive = status === ApiXTdhGrantStatus.Granted;

    if (!isPending && !isActive) {
      return null;
    }

    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <CustomTooltip content="Stop Grant">
          <button
            onClick={() => setActiveModal("STOP")}
            disabled={stopGrant.isPending || revokeGrant.isPending}
            className="tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-rounded-lg tw-bg-iron-800 tw-text-iron-300 hover:tw-text-iron-100 hover:tw-bg-iron-700 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-border-0 tw-p-0 tw-shadow-none tw-outline-none"
          >
            {stopGrant.isPending ? (
              <svg
                className="tw-animate-spin tw-h-4 tw-w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="tw-opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="tw-opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="tw-w-5 tw-h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </CustomTooltip>
        <CustomTooltip content="Revoke Grant">
          <button
            onClick={() => setActiveModal("REVOKE")}
            disabled={stopGrant.isPending || revokeGrant.isPending}
            className="tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-rounded-lg tw-bg-red/10 tw-text-red hover:tw-bg-red/20 tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-border-0 tw-p-0 tw-shadow-none tw-outline-none"
          >
            {revokeGrant.isPending ? (
              <svg
                className="tw-animate-spin tw-h-4 tw-w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="tw-opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="tw-opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="tw-w-5 tw-h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </CustomTooltip>
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
        message="This grant will be stopped immediately. All previously granted TDH will remain untouched."
        confirmText="Stop Grant"
        isConfirming={stopGrant.isPending}
        confirmButtonClass="tw-cursor-pointer tw-bg-iron-800 tw-border-iron-800 hover:tw-bg-iron-700 hover:tw-border-iron-700 tw-text-white"
        icon={
          <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-iron-800 tw-border tw-border-solid tw-border-iron-700">
            <svg
              className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-300"
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
