"use client";

import Button from "@/components/utils/button/Button";
import { DELEGATION_ALL_ADDRESS } from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { faEdit, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import { Spinner } from "../../dotLoader/DotLoader";
import type { ContractDelegation } from "../CollectionDelegation.utils";
import type { DelegationCollection } from "../delegation-constants";
import { MAX_BULK_ACTIONS } from "../delegation-constants";
import type { DelegationToastState } from "../DelegationToast";
import { CHECKBOX_CLASS } from "./collection-delegation-helpers";
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
    delegationsError: boolean;
    onRetry: () => void;
    activeConsolidations: ActiveConsolidation[];
    revocation: DelegationRevocation;
    chainsMatch: () => boolean;
    getSwitchToMessage: () => string;
    showDelegationToast: (toast: DelegationToastState) => void;
    onEditDelegation: (params: {
      wallet: string;
      use_case: number;
      display: string;
    }) => void;
  }>
) {
  const locale = useBrowserLocale();
  const { scope, myDelegations, collection, delegationsLoaded } = props;
  const { activeConsolidations, revocation, chainsMatch } = props;
  const { getSwitchToMessage, showDelegationToast, onEditDelegation } = props;
  const { bulkRevocations } = revocation;
  const rowActionTooltipId = buildTooltipId("delegation-row-actions", scope);

  function printOutgoingDelegationRow(args: DelegationRowRenderArgs) {
    const { delegationIndex, walletIndex, delegationsCount, del } = args;
    const { walletDelegation: w } = args;
    const { consolidationStatus, statusUnavailable, pending, isConsolidation } =
      args;

    return (
      <tr
        key={`outgoing-${del.useCase.use_case}-${delegationIndex}-${walletIndex}-${w.wallet}`}
      >
        <td className="tw-py-1">
          <div className="tw-flex tw-flex-col tw-gap-3 tw-rounded-lg tw-bg-white/[0.025] tw-p-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
            <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
              {delegationsCount >= 2 && (
                <input
                  aria-label={t(
                    locale,
                    "delegation.collection.outgoing.selectBulk",
                    { wallet: w.wallet }
                  )}
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
                label={t(locale, "delegation.collection.row.label.incoming")}
                walletDelegation={w}
                consolidationStatus={consolidationStatus}
                statusUnavailable={statusUnavailable}
                pending={pending}
                isConsolidation={isConsolidation}
              />
            </div>
            <div className="tw-flex tw-flex-none tw-items-center tw-gap-1.5 tw-self-end sm:tw-self-auto">
              <button
                type="button"
                aria-label={t(
                  locale,
                  "delegation.collection.outgoing.editAriaLabel",
                  { wallet: w.wallet }
                )}
                className="tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.035] tw-p-0 tw-text-iron-300 tw-shadow-sm tw-shadow-black/20 tw-transition-colors hover:tw-border-white/20 hover:tw-bg-white/[0.07] hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
                data-tooltip-id={rowActionTooltipId}
                data-tooltip-content={t(
                  locale,
                  "delegation.collection.outgoing.edit"
                )}
                onClick={() => {
                  onEditDelegation({
                    wallet: w.wallet,
                    use_case: del.useCase.use_case,
                    display: del.useCase.display,
                  });
                }}
              >
                <FontAwesomeIcon
                  aria-hidden="true"
                  icon={faEdit}
                  className="tw-size-4"
                />
              </button>
              <button
                type="button"
                aria-label={t(
                  locale,
                  "delegation.collection.outgoing.revokeAriaLabel",
                  { wallet: w.wallet }
                )}
                className="hover:tw-text-red-100 tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-error/25 tw-bg-error/10 tw-p-0 tw-text-error tw-shadow-sm tw-shadow-black/20 tw-transition-colors hover:tw-border-error/40 hover:tw-bg-error/20 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
                data-tooltip-id={rowActionTooltipId}
                data-tooltip-content={t(
                  locale,
                  "delegation.collection.outgoing.revoke"
                )}
                onClick={() => {
                  const title = t(
                    locale,
                    "delegation.collection.toast.revokingDelegation"
                  );
                  let toast: DelegationToastState = {
                    status: "confirm_wallet",
                    title,
                  };
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
                    toast = {
                      status: "error",
                      title,
                      message: getSwitchToMessage(),
                    };
                  }
                  showDelegationToast(toast);
                }}
              >
                <FontAwesomeIcon
                  aria-hidden="true"
                  icon={faXmark}
                  className="tw-size-4"
                />
              </button>
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
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-bg-white/[0.025] tw-p-3">
            <span className="tw-text-sm tw-font-medium tw-text-iron-300">
              {t(locale, "delegation.collection.outgoing.selected", {
                count:
                  bulkRevocations.length === MAX_BULK_ACTIONS
                    ? t(locale, "delegation.collection.outgoing.selectedMax", {
                        count: formatInteger(locale, MAX_BULK_ACTIONS),
                      })
                    : formatInteger(locale, bulkRevocations.length),
              })}
            </span>
            <Button
              type="button"
              disabled={bulkRevocations.length < 2}
              variant="destructive"
              size="lg"
              onClick={() => {
                const title = t(
                  locale,
                  "delegation.collection.toast.batchRevoking"
                );
                let toast: DelegationToastState = {
                  status: "confirm_wallet",
                  title,
                };
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
                  toast = {
                    status: "error",
                    title,
                    message: getSwitchToMessage(),
                  };
                }
                showDelegationToast(toast);
              }}
            >
              {t(locale, "delegation.collection.outgoing.batchRevoke")}
              {revocation.batchRevokeInFlight && (
                <output className="tw-inline-flex tw-items-center">
                  <Spinner dimension={20} />
                  <span className="tw-sr-only">
                    {t(locale, "delegation.collection.transaction.pending")}
                  </span>
                </output>
              )}
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <DelegationsTable
        direction="outgoing"
        scope={scope}
        myDelegations={myDelegations}
        collection={collection}
        delegationsLoaded={delegationsLoaded}
        delegationsError={props.delegationsError}
        onRetry={props.onRetry}
        activeConsolidations={activeConsolidations}
        renderRow={printOutgoingDelegationRow}
        renderFooter={printBatchRevokeFooter}
      />
      <Tooltip id={rowActionTooltipId} place="top" style={TOOLTIP_STYLES} />
    </>
  );
}
