"use client";

import { DELEGATION_ALL_ADDRESS } from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ContractDelegation } from "../CollectionDelegation.utils";
import type { DelegationCollection } from "../delegation-constants";
import {
  MEMES_COLLECTION,
  SUB_DELEGATION_USE_CASE,
} from "../delegation-constants";
import {
  BUTTON_ICON_CLASS,
  CHECKBOX_CLASS,
  DANGER_ACTION_CLASS,
  PRIMARY_ACTION_CLASS,
} from "./collection-delegation-helpers";
import { DelegationRowDetails } from "./DelegationRowDetails";
import {
  DelegationsTable,
  type DelegationRowRenderArgs,
} from "./DelegationsTable";
import type { ActiveConsolidation } from "./useCollectionDelegationReads";

/** The forms an incoming delegation manager can open for a delegator. */
export type SubDelegationForm =
  | "delegation"
  | "subDelegation"
  | "consolidation"
  | "primaryAddress"
  | "revocation";

/**
 * The table of incoming delegations for one scope (delegations, manager
 * rights, or consolidations). For manager rights it also renders the
 * act-on-behalf-of-delegator actions.
 */
export function IncomingDelegationsTable(
  props: Readonly<{
    scope: string;
    myDelegations: ContractDelegation[];
    collection: DelegationCollection;
    delegationsLoaded: boolean;
    delegationsError: boolean;
    onRetry: () => void;
    activeConsolidations: ActiveConsolidation[];
    isSubdelegation?: boolean | undefined;
    subDelegationOriginalDelegator: string | undefined;
    onSetOriginalDelegator: (wallet: string | undefined) => void;
    onShowSubForm: (form: SubDelegationForm) => void;
  }>
) {
  const locale = useBrowserLocale();
  const { scope, myDelegations, collection, delegationsLoaded } = props;
  const { activeConsolidations, isSubdelegation } = props;
  const { subDelegationOriginalDelegator, onSetOriginalDelegator } = props;
  const { onShowSubForm } = props;

  function printIncomingDelegationRow(args: DelegationRowRenderArgs) {
    const { delegationIndex, walletIndex, del } = args;
    const { walletDelegation: w } = args;
    const { consolidationStatus, statusUnavailable, pending, isConsolidation } =
      args;

    return (
      <tr
        key={`incoming-${del.useCase.use_case}-${delegationIndex}-${walletIndex}-${w.wallet}`}
      >
        <td className="tw-py-1">
          <div className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-4">
            <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
              {del.useCase.use_case === SUB_DELEGATION_USE_CASE.use_case ? (
                <input
                  aria-label={t(
                    locale,
                    "delegation.collection.incoming.selectOriginal",
                    { wallet: w.wallet }
                  )}
                  type="checkbox"
                  className={CHECKBOX_CLASS}
                  checked={areEqualAddresses(
                    subDelegationOriginalDelegator,
                    w.wallet
                  )}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSetOriginalDelegator(w.wallet);
                    } else {
                      onSetOriginalDelegator(undefined);
                    }
                  }}
                />
              ) : (
                <></>
              )}
              <DelegationRowDetails
                label={t(locale, "delegation.collection.row.label.outgoing")}
                walletDelegation={w}
                consolidationStatus={consolidationStatus}
                statusUnavailable={statusUnavailable}
                pending={pending}
                isConsolidation={isConsolidation}
              />
            </span>
          </div>
        </td>
      </tr>
    );
  }

  function printSubDelegationActionsFooter(delegationsCount: number) {
    if (!delegationsLoaded || !isSubdelegation || delegationsCount === 0) {
      return null;
    }
    return (
      <tr>
        <td colSpan={2} className="tw-pt-3">
          <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-3">
            <p className="tw-mb-3 tw-text-sm tw-text-iron-300">
              {t(locale, "delegation.collection.incoming.actionsDescription")}
            </p>
            <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <button
                type="button"
                disabled={subDelegationOriginalDelegator === undefined}
                className={PRIMARY_ACTION_CLASS}
                onClick={() => {
                  onShowSubForm("delegation");
                }}
              >
                <FontAwesomeIcon icon={faPlus} className={BUTTON_ICON_CLASS} />
                {t(locale, "delegation.collection.incoming.registerDelegation")}
              </button>
              <button
                type="button"
                disabled={subDelegationOriginalDelegator === undefined}
                className={PRIMARY_ACTION_CLASS}
                onClick={() => {
                  onShowSubForm("subDelegation");
                }}
              >
                <FontAwesomeIcon icon={faPlus} className={BUTTON_ICON_CLASS} />
                {t(locale, "delegation.collection.incoming.registerManager")}
              </button>
              <button
                type="button"
                disabled={subDelegationOriginalDelegator === undefined}
                className={PRIMARY_ACTION_CLASS}
                onClick={() => {
                  onShowSubForm("consolidation");
                }}
              >
                <FontAwesomeIcon icon={faPlus} className={BUTTON_ICON_CLASS} />
                {t(
                  locale,
                  "delegation.collection.incoming.registerConsolidation"
                )}
              </button>
              {(collection.contract === DELEGATION_ALL_ADDRESS ||
                collection.contract === MEMES_COLLECTION.contract) && (
                <button
                  type="button"
                  disabled={subDelegationOriginalDelegator === undefined}
                  className={PRIMARY_ACTION_CLASS}
                  onClick={() => {
                    onShowSubForm("primaryAddress");
                  }}
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className={BUTTON_ICON_CLASS}
                  />
                  {t(locale, "delegation.collection.incoming.assignPrimary")}
                </button>
              )}
              <button
                type="button"
                disabled={subDelegationOriginalDelegator === undefined}
                className={DANGER_ACTION_CLASS}
                onClick={() => {
                  onShowSubForm("revocation");
                }}
              >
                <FontAwesomeIcon icon={faMinus} className={BUTTON_ICON_CLASS} />
                {t(locale, "delegation.collection.incoming.revoke")}
              </button>
            </span>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <DelegationsTable
      direction="incoming"
      scope={scope}
      myDelegations={myDelegations}
      collection={collection}
      delegationsLoaded={delegationsLoaded}
      delegationsError={props.delegationsError}
      onRetry={props.onRetry}
      activeConsolidations={activeConsolidations}
      renderRow={printIncomingDelegationRow}
      renderFooter={printSubDelegationActionsFooter}
    />
  );
}
