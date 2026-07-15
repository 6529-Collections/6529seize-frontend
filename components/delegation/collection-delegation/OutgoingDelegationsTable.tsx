"use client";

import { type ReactNode } from "react";

import { DELEGATION_ALL_ADDRESS } from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { faEdit, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import { Spinner } from "../../dotLoader/DotLoader";
import type { ContractDelegation } from "../CollectionDelegation.utils";
import type { DelegationCollection } from "../delegation-constants";
import { MAX_BULK_ACTIONS } from "../delegation-constants";
import type { DelegationToastState } from "../DelegationToast";
import {
  CHECKBOX_CLASS,
  DANGER_ACTION_CLASS,
} from "./collection-delegation-helpers";
import { DelegationRowDetails } from "./DelegationRowDetails";
import {
  DelegationsTable,
  type DelegationRowRenderArgs,
} from "./DelegationsTable";
import type { ActiveConsolidation } from "./useCollectionDelegationReads";
import type { DelegationRevocation } from "./useDelegationRevocation";

/**
 * The table of outgoing delegations for one scope (delegations, manager
 * rights, or consolidations), including per-row edit/revoke actions and the
 * bulk-revocation footer.
 */
export function OutgoingDelegationsTable(
  props: Readonly<{
    scope: string;
    myDelegations: ContractDelegation[];
    collection: DelegationCollection;
    delegationsLoaded: boolean;
    activeConsolidations: ActiveConsolidation[];
    revocation: DelegationRevocation;
    chainsMatch: () => boolean;
    getSwitchToMessage: () => ReactNode;
    showDelegationToast: (toast: DelegationToastState) => void;
    onEditDelegation: (params: {
      wallet: string;
      use_case: number;
      display: string;
    }) => void;
  }>
) {
  const { scope, myDelegations, collection, delegationsLoaded } = props;
  const { activeConsolidations, revocation, chainsMatch } = props;
  const { getSwitchToMessage, showDelegationToast, onEditDelegation } = props;
  const { bulkRevocations } = revocation;

  function printOutgoingDelegationRow(args: DelegationRowRenderArgs) {
    const { delegationIndex, walletIndex, delegationsCount, del } = args;
    const { walletDelegation: w } = args;
    const { consolidationStatus, pending, isConsolidation } = args;

    return (
      <tr
        key={`outgoing-${del.useCase.use_case}-${delegationIndex}-${walletIndex}-${w.wallet}`}
      >
        <td className="tw-py-1">
          <div className="tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
            <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
              {delegationsCount >= 2 && (
                <input
                  aria-label={`Select ${w.wallet} for bulk revoke`}
                  type="checkbox"
                  className={CHECKBOX_CLASS}
                  disabled={
                    bulkRevocations.length === MAX_BULK_ACTIONS &&
                    !bulkRevocations.some(
                      (bd) =>
                        bd.use_case === del.useCase.use_case &&
                        areEqualAddresses(bd.wallet, w.wallet)
                    )
                  }
                  checked={bulkRevocations.some(
                    (bd) =>
                      bd.use_case === del.useCase.use_case &&
                      areEqualAddresses(bd.wallet, w.wallet)
                  )}
                  onChange={(e) => {
                    if (e.target.checked) {
                      revocation.addToBulkRevocations(del, w.wallet);
                    } else {
                      revocation.removeFromBulkRevocations(del, w.wallet);
                    }
                  }}
                />
              )}
              <DelegationRowDetails
                label="Incoming"
                walletDelegation={w}
                consolidationStatus={consolidationStatus}
                pending={pending}
                isConsolidation={isConsolidation}
              />
            </div>
            <div className="tw-flex tw-flex-none tw-items-center tw-gap-2 tw-self-end sm:tw-self-auto">
              <button
                type="button"
                aria-label={`Edit delegation for ${w.wallet}`}
                className="tw-inline-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-800 tw-p-0 tw-text-iron-200 tw-transition-colors hover:tw-border-iron-400 hover:tw-bg-iron-700 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                data-tooltip-id={`edit-${del.useCase.use_case}-${w.wallet}`}
                onClick={() => {
                  onEditDelegation({
                    wallet: w.wallet,
                    use_case: del.useCase.use_case,
                    display: del.useCase.display,
                  });
                }}
              >
                <FontAwesomeIcon icon={faEdit} className="tw-h-4 tw-w-4" />
              </button>
              <Tooltip
                id={`edit-${del.useCase.use_case}-${w.wallet}`}
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                Edit
              </Tooltip>
              <button
                type="button"
                aria-label={`Revoke delegation for ${w.wallet}`}
                className="tw-inline-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-red tw-bg-red tw-p-0 tw-text-white tw-transition-colors hover:tw-bg-[#e05f57] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-red"
                data-tooltip-id={`revoke-${del.useCase.use_case}-${w.wallet}`}
                onClick={() => {
                  const title = "Revoking Delegation";
                  let message: ReactNode = "Confirm in your wallet...";
                  if (chainsMatch()) {
                    revocation.setRevokeDelegationParams({
                      collection: areEqualAddresses(
                        collection.contract,
                        DELEGATION_ALL_ADDRESS
                      )
                        ? DELEGATION_ALL_ADDRESS
                        : collection.contract,
                      address: w.wallet,
                      use_case: del.useCase.use_case,
                    });
                  } else {
                    message = getSwitchToMessage();
                  }
                  showDelegationToast({ title, message });
                }}
              >
                <FontAwesomeIcon icon={faXmark} className="tw-h-4 tw-w-4" />
              </button>
              <Tooltip
                id={`revoke-${del.useCase.use_case}-${w.wallet}`}
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                Revoke
              </Tooltip>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  function printBatchRevokeFooter(delegationsCount: number) {
    if (delegationsCount <= 1) {
      return null;
    }
    return (
      <tr>
        <td colSpan={4} className="tw-pt-3">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-3">
            <span className="tw-text-sm tw-font-medium tw-text-iron-300">
              Selected:{" "}
              {bulkRevocations.length === MAX_BULK_ACTIONS
                ? `${MAX_BULK_ACTIONS} (max)`
                : bulkRevocations.length}
            </span>
            <button
              type="button"
              disabled={bulkRevocations.length < 2}
              className={DANGER_ACTION_CLASS}
              onClick={() => {
                const title = "Batch Revoking Delegations";
                let message: ReactNode = "Confirm in your wallet...";
                if (chainsMatch()) {
                  revocation.setBatchRevokeDelegationParams({
                    collections: [...bulkRevocations].map(() =>
                      areEqualAddresses(
                        collection.contract,
                        DELEGATION_ALL_ADDRESS
                      )
                        ? DELEGATION_ALL_ADDRESS
                        : collection.contract
                    ),
                    addresses: [...bulkRevocations].map((br) => br.wallet),
                    use_cases: [...bulkRevocations].map((br) => br.use_case),
                  });
                } else {
                  message = getSwitchToMessage();
                }
                showDelegationToast({ title, message });
              }}
            >
              Batch Revoke
              {revocation.batchRevokeInFlight && (
                <output className="tw-inline-flex tw-items-center">
                  <Spinner dimension={20} />
                  <span className="tw-sr-only">Transaction pending</span>
                </output>
              )}
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <DelegationsTable
      direction="outgoing"
      scope={scope}
      myDelegations={myDelegations}
      collection={collection}
      delegationsLoaded={delegationsLoaded}
      activeConsolidations={activeConsolidations}
      renderRow={printOutgoingDelegationRow}
      renderFooter={printBatchRevokeFooter}
    />
  );
}
