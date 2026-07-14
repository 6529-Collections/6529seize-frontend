"use client";

import { DELEGATION_ALL_ADDRESS } from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "../Delegation.module.css";
import type { ContractDelegation } from "../CollectionDelegation.utils";
import type { DelegationCollection } from "../delegation-constants";
import {
  MEMES_COLLECTION,
  SUB_DELEGATION_USE_CASE,
} from "../delegation-constants";
import { CHECKBOX_CLASS } from "./collection-delegation-helpers";
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
    activeConsolidations: ActiveConsolidation[];
    isSubdelegation?: boolean | undefined;
    subDelegationOriginalDelegator: string | undefined;
    onSetOriginalDelegator: (wallet: string | undefined) => void;
    onShowSubForm: (form: SubDelegationForm) => void;
  }>
) {
  const { scope, myDelegations, collection, delegationsLoaded } = props;
  const { activeConsolidations, isSubdelegation } = props;
  const { subDelegationOriginalDelegator, onSetOriginalDelegator } = props;
  const { onShowSubForm } = props;

  function printIncomingDelegationRow(args: DelegationRowRenderArgs) {
    const { delegationIndex, walletIndex, del } = args;
    const { walletDelegation: w } = args;
    const { consolidationStatus, pending, isConsolidation } = args;

    return (
      <tr
        key={`incoming-${del.useCase.use_case}-${delegationIndex}-${walletIndex}-${w.wallet}`}
      >
        <td>
          <div className="tw-flex tw-flex-col tw-gap-2 tw-bg-[rgb(34,34,34)] tw-px-[15px] tw-pb-2.5 tw-pt-3">
            <span className="tw-flex tw-items-center tw-gap-3">
              {del.useCase.use_case == SUB_DELEGATION_USE_CASE.use_case ? (
                <input
                  aria-label={`Select ${w.wallet} as original delegator`}
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
                label="Outgoing"
                walletDelegation={w}
                consolidationStatus={consolidationStatus}
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
          <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <button
              className={`${styles["useCaseWalletUpdate"]} ${
                subDelegationOriginalDelegator === undefined
                  ? styles["useCaseWalletUpdateDisabled"]
                  : ""
              }`}
              onClick={() => {
                onShowSubForm("delegation");
              }}
            >
              <FontAwesomeIcon icon={faPlus} className={styles["buttonIcon"]} />
              Register Delegation
            </button>
            <button
              className={`${styles["useCaseWalletUpdate"]} ${
                subDelegationOriginalDelegator === undefined
                  ? styles["useCaseWalletUpdateDisabled"]
                  : ""
              }`}
              onClick={() => {
                onShowSubForm("subDelegation");
              }}
            >
              <FontAwesomeIcon icon={faPlus} className={styles["buttonIcon"]} />
              Register Delegation Manager
            </button>
            <button
              className={`${styles["useCaseWalletUpdate"]} ${
                subDelegationOriginalDelegator === undefined
                  ? styles["useCaseWalletUpdateDisabled"]
                  : ""
              }`}
              onClick={() => {
                onShowSubForm("consolidation");
              }}
            >
              <FontAwesomeIcon icon={faPlus} className={styles["buttonIcon"]} />
              Register Consolidation
            </button>
            {(collection.contract === DELEGATION_ALL_ADDRESS ||
              collection.contract === MEMES_COLLECTION.contract) && (
              <button
                className={`${styles["useCaseWalletUpdate"]} ${
                  subDelegationOriginalDelegator === undefined
                    ? styles["useCaseWalletUpdateDisabled"]
                    : ""
                }`}
                onClick={() => {
                  onShowSubForm("primaryAddress");
                }}
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  className={styles["buttonIcon"]}
                />
                Assign Primary Address
              </button>
            )}
            <button
              className={`${styles["useCaseWalletRevoke"]} ${
                subDelegationOriginalDelegator === undefined
                  ? styles["useCaseWalletRevokeDisabled"]
                  : ""
              }`}
              onClick={() => {
                onShowSubForm("revocation");
              }}
            >
              <FontAwesomeIcon
                icon={faMinus}
                className={styles["buttonIcon"]}
              />
              Revoke
            </button>
          </span>
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
      activeConsolidations={activeConsolidations}
      renderRow={printIncomingDelegationRow}
      renderFooter={printSubDelegationActionsFooter}
    />
  );
}
