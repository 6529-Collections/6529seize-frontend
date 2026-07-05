"use client";

import { Fragment } from "react";

import { DELEGATION_ALL_ADDRESS } from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "../Delegation.module.css";
import type {
  ContractDelegation,
  ContractWalletDelegation,
} from "../CollectionDelegation.utils";
import type { DelegationCollection } from "../delegation-constants";
import {
  CONSOLIDATION_USE_CASE,
  MEMES_COLLECTION,
  SUB_DELEGATION_USE_CASE,
} from "../delegation-constants";
import { CHECKBOX_CLASS } from "./collection-delegation-helpers";
import { DelegationRowDetails } from "./DelegationRowDetails";
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

  function printIncomingDelegationRow(
    delegationIndex: number,
    walletIndex: number,
    del: ContractDelegation,
    w: ContractWalletDelegation,
    consolidationStatus: string | undefined,
    pending: boolean,
    isConsolidation: boolean
  ) {
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

  let delegations: number = 0;
  myDelegations.map((del) => {
    if (del.wallets.length > 0) {
      delegations += del.wallets.length;
    }
  });

  return (
    <div className="tw-w-full tw-p-0">
      <div className={styles["delegationsTableScrollContainer"]}>
        <div className="tw-w-full">
          <table className={`${styles["delegationsTable"]} tw-w-full`}>
            <tbody>
              {delegations > 0 ? (
                myDelegations.map((del, index: number) => {
                  if (!del.wallets.length) return null;

                  const isConsolidation =
                    del.useCase.use_case === CONSOLIDATION_USE_CASE.use_case;
                  return (
                    <Fragment key={`incoming-${del.useCase.use_case}-${index}`}>
                      <tr>
                        <td
                          colSpan={4}
                          className={styles["delegationsTableUseCaseHeader"]}
                        >
                          #{del.useCase.use_case} - {del.useCase.display}
                        </td>
                      </tr>
                      {del.wallets.map((w, walletIndex) => {
                        const consolidationStatus = activeConsolidations.find(
                          (i) => areEqualAddresses(w.wallet, i.wallet)
                        )?.status;
                        const pending =
                          consolidationStatus === "consolidation incomplete";
                        return printIncomingDelegationRow(
                          index,
                          walletIndex,
                          del,
                          w,
                          consolidationStatus,
                          pending,
                          isConsolidation
                        );
                      })}
                    </Fragment>
                  );
                })
              ) : !delegationsLoaded ? (
                <tr>
                  <td colSpan={4}>
                    Fetching incoming {scope} for {collection.title}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={4}>
                    No incoming {scope} found for {collection.title}
                  </td>
                </tr>
              )}
              {delegationsLoaded && isSubdelegation && delegations > 0 && (
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
                        <FontAwesomeIcon
                          icon={faPlus}
                          className={styles["buttonIcon"]}
                        />
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
                        <FontAwesomeIcon
                          icon={faPlus}
                          className={styles["buttonIcon"]}
                        />
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
                        <FontAwesomeIcon
                          icon={faPlus}
                          className={styles["buttonIcon"]}
                        />
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
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
