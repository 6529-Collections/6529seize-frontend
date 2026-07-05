"use client";

import { Fragment, type ReactNode } from "react";

import { DELEGATION_ALL_ADDRESS } from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { faEdit, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import { Spinner } from "../../dotLoader/DotLoader";
import styles from "../Delegation.module.css";
import type {
  ContractDelegation,
  ContractWalletDelegation,
} from "../CollectionDelegation.utils";
import type { DelegationCollection } from "../delegation-constants";
import {
  CONSOLIDATION_USE_CASE,
  MAX_BULK_ACTIONS,
} from "../delegation-constants";
import type { DelegationToastState } from "../DelegationToast";
import { CHECKBOX_CLASS } from "./collection-delegation-helpers";
import { DelegationRowDetails } from "./DelegationRowDetails";
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

  function printOutgoingDelegationRow(
    delegationIndex: number,
    walletIndex: number,
    delegations: number,
    del: ContractDelegation,
    w: ContractWalletDelegation,
    consolidationStatus: string | undefined,
    pending: boolean,
    isConsolidation: boolean
  ) {
    return (
      <tr
        key={`outgoing-${del.useCase.use_case}-${delegationIndex}-${walletIndex}-${w.wallet}`}
      >
        <td>
          <div className="tw-flex tw-flex-col tw-gap-2 tw-bg-[rgb(34,34,34)] tw-px-[15px] tw-pb-2.5 tw-pt-3">
            <span className="tw-flex tw-items-center tw-justify-between">
              <span className="tw-flex tw-items-center tw-gap-3">
                {delegations >= 2 && (
                  <input
                    aria-label={`Select ${w.wallet} for bulk revoke`}
                    type="checkbox"
                    className={CHECKBOX_CLASS}
                    disabled={
                      bulkRevocations.length == MAX_BULK_ACTIONS &&
                      !bulkRevocations.some(
                        (bd) =>
                          bd.use_case == del.useCase.use_case &&
                          areEqualAddresses(bd.wallet, w.wallet)
                      )
                    }
                    checked={bulkRevocations.some(
                      (bd) =>
                        bd.use_case == del.useCase.use_case &&
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
              </span>
              <span className="tw-flex tw-items-center tw-gap-2">
                <>
                  <FontAwesomeIcon
                    icon={faEdit}
                    style={{ cursor: "pointer" }}
                    height={25}
                    data-tooltip-id={`edit-${del.useCase.use_case}-${w.wallet}`}
                    onClick={() => {
                      onEditDelegation({
                        wallet: w.wallet,
                        use_case: del.useCase.use_case,
                        display: del.useCase.display,
                      });
                    }}
                  ></FontAwesomeIcon>
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
                </>
                <>
                  <FontAwesomeIcon
                    icon={faXmark}
                    color="white"
                    fill="white"
                    style={{
                      cursor: "pointer",
                      borderRadius: "25px",
                      backgroundColor: "#c51d34",
                      padding: "5px",
                    }}
                    width={25}
                    height={25}
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
                  ></FontAwesomeIcon>
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
                </>
              </span>
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
                    <Fragment key={`outgoing-${del.useCase.use_case}-${index}`}>
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
                        return printOutgoingDelegationRow(
                          index,
                          walletIndex,
                          delegations,
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
                    Fetching outgoing {scope} for {collection.title}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={4}>
                    No outgoing {scope} found for {collection.title}
                  </td>
                </tr>
              )}
              {delegations > 1 && (
                <tr>
                  <td colSpan={4} className="tw-pt-3">
                    selected:{" "}
                    {bulkRevocations.length === MAX_BULK_ACTIONS
                      ? `${MAX_BULK_ACTIONS} (max)`
                      : bulkRevocations.length}
                    &nbsp;&nbsp;
                    <button
                      disabled={bulkRevocations.length < 2}
                      className={`${styles["useCaseWalletRevoke"]} ${
                        bulkRevocations.length < 2
                          ? `${styles["useCaseWalletRevokeDisabled"]}`
                          : ``
                      }`}
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
                            addresses: [...bulkRevocations].map(
                              (br) => br.wallet
                            ),
                            use_cases: [...bulkRevocations].map(
                              (br) => br.use_case
                            ),
                          });
                        } else {
                          message = getSwitchToMessage();
                        }
                        showDelegationToast({ title, message });
                      }}
                    >
                      Batch Revoke
                      {revocation.batchRevokeInFlight && (
                        <span
                          className="tw-inline-flex tw-items-center"
                          role="status"
                        >
                          <Spinner dimension={20} />
                          <span className="tw-sr-only">
                            Transaction pending
                          </span>
                        </span>
                      )}
                    </button>
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
