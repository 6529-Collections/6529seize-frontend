"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { DELEGATION_ABI } from "@/abis/abis";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
} from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import {
  faInfoCircle,
  faLock,
  faLockOpen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import { Spinner } from "../../dotLoader/DotLoader";
import styles from "../Delegation.module.css";
import type { DelegationCollection } from "../delegation-constants";
import {
  ALL_USE_CASES,
  ANY_COLLECTION_PATH,
  CONSOLIDATION_USE_CASE,
  DELEGATION_USE_CASES,
  PRIMARY_ADDRESS_USE_CASE,
  SUB_DELEGATION_USE_CASE,
} from "../delegation-constants";
import type { DelegationToastState } from "../DelegationToast";
import { LOCK_SELECT_CLASS } from "./collection-delegation-helpers";
import type { CollectionLocks } from "./useCollectionLocks";

interface CollectionDelegationLocksProps {
  collection: DelegationCollection;
  locks: CollectionLocks;
  chainsMatch: () => boolean;
  getSwitchToMessage: () => ReactNode;
  showDelegationToast: (toast: DelegationToastState) => void;
}

/**
 * Maps a selected use-case number to its index in the lock-status
 * multicall arrays. NOTE: the special use cases land one position before
 * their actual array slots — issue #3108 tracks correcting this mapping.
 */
function getLockUseCaseIndex(value: number) {
  if (value === CONSOLIDATION_USE_CASE.use_case) {
    return 18;
  }
  if (value === SUB_DELEGATION_USE_CASE.use_case) {
    return 17;
  }
  if (value === PRIMARY_ADDRESS_USE_CASE.use_case) {
    return 16;
  }
  return value - 1;
}

function CollectionLockUseCaseOptions(
  props: Readonly<{ locks: CollectionLocks }>
) {
  return ALL_USE_CASES.map((useCase, index) => {
    if (useCase.use_case === 1) return null;
    const asteriskDisplay = props.locks.useCaseLockStatusesGlobal.data?.[index]
      ? ` *`
      : ``;
    const lockDisplay =
      props.locks.useCaseLockStatuses.data?.[index] ||
      props.locks.useCaseLockStatusesGlobal.data?.[index] ||
      props.locks.collectionLockRead.data
        ? ` - LOCKED${asteriskDisplay}`
        : ` - UNLOCKED`;

    return (
      <option
        key={`collection-delegation-select-use-case-${useCase.use_case}`}
        value={useCase.use_case}
      >
        #{useCase.use_case} - {useCase.display}
        {lockDisplay}
      </option>
    );
  });
}

function CollectionWalletLockButton(
  props: Readonly<CollectionDelegationLocksProps>
) {
  const { collection, locks, chainsMatch, getSwitchToMessage } = props;
  const { showDelegationToast } = props;

  return (
    <button
      className={`${styles["lockDelegationBtn"]} ${
        locks.collectionLockReadGlobal?.data
          ? styles["lockDelegationBtnDisabled"]
          : ""
      }`}
      onClick={() => {
        const title = `${
          locks.collectionLockRead.data ? `Unlocking` : `Locking`
        } Wallet`;
        let message: ReactNode = "Confirm in your wallet...";
        locks.collectionLockToastTitleRef.current = title;
        if (chainsMatch()) {
          locks.collectionLockWrite.writeContract({
            address: DELEGATION_CONTRACT.contract,
            abi: DELEGATION_ABI,
            chainId: DELEGATION_CONTRACT.chain_id,
            args: [collection.contract, !locks.collectionLockRead.data],
            functionName: "setCollectionLock",
          });
        } else {
          message = getSwitchToMessage();
        }
        showDelegationToast({ title, message });
      }}
    >
      <FontAwesomeIcon
        icon={locks.collectionLockRead.data ? faLock : faLockOpen}
        className={styles["buttonIcon"]}
      />
      {locks.collectionLockRead.data ? "Unlock" : "Lock"} Wallet
      {locks.collectionLockReadGlobal?.data &&
      !areEqualAddresses(collection.contract, DELEGATION_ALL_ADDRESS)
        ? ` *`
        : ``}
      {(locks.collectionLockWrite.isPending ||
        locks.waitCollectionLockWrite.isLoading) && <Spinner />}
    </button>
  );
}

/**
 * The "Locks" section of the collection-delegation screen: the wallet-level
 * lock button and the per-use-case lock select/button pair.
 */
export function CollectionDelegationLocks(
  props: Readonly<CollectionDelegationLocksProps>
) {
  const { collection, locks, chainsMatch, getSwitchToMessage } = props;
  const { showDelegationToast } = props;

  return (
    <div className="tw-w-full tw-p-0">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-2 tw-pt-5">
        <div className="tw-w-full tw-px-3">
          <h4>
            Locks{" "}
            <>
              <FontAwesomeIcon
                className={styles["infoIcon"]}
                icon={faInfoCircle}
                data-tooltip-id="locks-info"
              ></FontAwesomeIcon>
              <Tooltip
                id="locks-info"
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                Locks only block incoming delegations for this collection scope.
                They do not revoke outgoing records.
              </Tooltip>
            </>
          </h4>
          <p className={styles["collectionSectionIntro"]}>
            Locks block incoming delegations for this collection scope. They do
            not stop delegations you already made to other wallets.
          </p>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-2 tw-pt-2">
        <div className="tw-w-full tw-px-3">
          <CollectionWalletLockButton {...props} />
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-2 tw-pt-3">
        <div className="tw-w-full tw-px-3 tw-pb-2 tw-pt-2 md:tw-w-1/3">
          <select
            aria-label="Lock or unlock use case"
            disabled={!!locks.collectionLockRead.data}
            className={`${styles["formInputLockUseCase"]} ${LOCK_SELECT_CLASS} ${
              locks.collectionLockRead.data ||
              locks.collectionLockReadGlobal?.data
                ? styles["formInputDisabled"]
                : ""
            }`}
            value={locks.lockUseCaseValue}
            onChange={(e) => {
              const value = Number.parseInt(e.target.value);
              locks.setLockUseCaseValue(value);
              locks.setLockUseCaseIndex(getLockUseCaseIndex(value));
              locks.useCaseLockToastTitleRef.current = "Locking Wallet";
              locks.useCaseLockWrite.reset();
            }}
          >
            <option value={0}>
              Lock/Unlock Use Case
              {locks.collectionLockRead.data ||
              locks.collectionLockReadGlobal?.data
                ? ` *`
                : ``}
            </option>
            <CollectionLockUseCaseOptions locks={locks} />
          </select>
        </div>
        {locks.lockUseCaseValue != 0 && (
          <div className="tw-flex tw-w-full tw-items-center tw-px-3 tw-pb-2 tw-pt-2 md:tw-w-2/3">
            {!locks.useCaseLockStatusesGlobal.data ||
            (locks.useCaseLockStatusesGlobal?.data &&
              // Double cast preserves the existing comparison against the
              // multicall envelope object (issue #3078 tracks reading
              // `.result` here); typing it honestly would change behavior.
              (locks.useCaseLockStatusesGlobal?.data[
                locks.lockUseCaseIndex
              ] as unknown as boolean) === false) ? (
              <button
                className={`${styles["lockUseCaseBtn"]}`}
                onClick={() => {
                  const useCase = DELEGATION_USE_CASES[locks.lockUseCaseIndex];
                  const title = `${
                    locks.useCaseLockStatuses?.data?.[locks.lockUseCaseIndex]
                      ? "Unlocking"
                      : "Locking"
                  } Wallet on Use Case #${useCase?.use_case} - ${
                    useCase?.display
                  }`;
                  let message: ReactNode = "Confirm in your wallet...";
                  locks.useCaseLockToastTitleRef.current = title;

                  if (chainsMatch()) {
                    locks.useCaseLockWrite.writeContract({
                      address: DELEGATION_CONTRACT.contract,
                      abi: DELEGATION_ABI,
                      chainId: DELEGATION_CONTRACT.chain_id,
                      args: [
                        collection.contract,
                        locks.lockUseCaseValue,
                        !locks.useCaseLockStatuses.data?.[
                          locks.lockUseCaseIndex
                        ],
                      ],
                      functionName: "setCollectionUsecaseLock",
                    });
                  } else {
                    message = getSwitchToMessage();
                  }
                  showDelegationToast({ title, message });
                }}
              >
                <FontAwesomeIcon
                  icon={
                    locks.useCaseLockStatuses.data?.[locks.lockUseCaseIndex]
                      ? faLock
                      : faLockOpen
                  }
                  className={styles["buttonIcon"]}
                />
                {locks.useCaseLockStatuses.data?.[locks.lockUseCaseIndex]
                  ? "Unlock"
                  : "Lock"}{" "}
                Use Case
                {(locks.useCaseLockWrite.isPending ||
                  locks.waitUseCaseLockWrite.isLoading) && <Spinner />}
              </button>
            ) : (
              <div>
                <span className={styles["hint"]}>* Note:</span> Unlock use case
                in{" "}
                <Link href={`/delegation/${ANY_COLLECTION_PATH}`}>
                  All Collections
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      {locks.collectionLockRead.data ? (
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-3">
          <div className="tw-w-full tw-px-3">
            <span className={styles["hint"]}>* Note:</span> Unlock Wallet to
            lock/unlock specific use cases
          </div>
        </div>
      ) : null}
      {locks.collectionLockReadGlobal?.data ? (
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-3">
          <div className="tw-w-full tw-px-3">
            <span className={styles["hint"]}>* Note:</span> Unlock Wallet on{" "}
            <Link href={`/delegation/${ANY_COLLECTION_PATH}`}>
              All Collections
            </Link>{" "}
            to lock/unlock specific collections and use cases
          </div>
        </div>
      ) : null}
    </div>
  );
}
