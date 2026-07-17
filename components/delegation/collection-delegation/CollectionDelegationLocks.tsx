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
import type { DelegationCollection } from "../delegation-constants";
import { ALL_USE_CASES, ANY_COLLECTION_PATH } from "../delegation-constants";
import type { DelegationToastState } from "../DelegationToast";
import {
  BUTTON_ICON_CLASS,
  LOCK_SELECT_CLASS,
  PRIMARY_ACTION_CLASS,
} from "./collection-delegation-helpers";
import type { CollectionLocks } from "./useCollectionLocks";

interface CollectionDelegationLocksProps {
  collection: DelegationCollection;
  locks: CollectionLocks;
  chainsMatch: () => boolean;
  getSwitchToMessage: () => string;
  showDelegationToast: (toast: DelegationToastState) => void;
}

interface LockStatusResult {
  readonly result?: unknown;
}

function getLockUseCaseIndex(value: number) {
  return ALL_USE_CASES.findIndex((useCase) => useCase.use_case === value);
}

function getLockStatus(
  statuses: readonly LockStatusResult[] | undefined,
  index: number
) {
  const result = statuses?.[index]?.result;
  return typeof result === "boolean" ? result : undefined;
}

function CollectionLockUseCaseOptions(
  props: Readonly<{ locks: CollectionLocks }>
) {
  return ALL_USE_CASES.map((useCase, index) => {
    if (useCase.use_case === 1) return null;
    const isLockedGlobally =
      getLockStatus(props.locks.useCaseLockStatusesGlobal.data, index) === true;
    const isLocked =
      getLockStatus(props.locks.useCaseLockStatuses.data, index) === true;
    const asteriskDisplay = isLockedGlobally ? ` *` : ``;
    const lockDisplay =
      isLocked ||
      isLockedGlobally ||
      Boolean(props.locks.collectionLockRead.data)
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
      type="button"
      disabled={Boolean(locks.collectionLockReadGlobal.data)}
      className={PRIMARY_ACTION_CLASS}
      onClick={() => {
        const title = `${
          locks.collectionLockRead.data ? `Unlocking` : `Locking`
        } Wallet`;
        let toast: DelegationToastState = {
          status: "confirm_wallet",
          title,
        };
        locks.setCollectionLockToastTitle(title);
        if (chainsMatch()) {
          locks.collectionLockWrite.writeContract({
            address: DELEGATION_CONTRACT.contract,
            abi: DELEGATION_ABI,
            chainId: DELEGATION_CONTRACT.chain_id,
            args: [collection.contract, !locks.collectionLockRead.data],
            functionName: "setCollectionLock",
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
        icon={locks.collectionLockRead.data ? faLock : faLockOpen}
        className={BUTTON_ICON_CLASS}
      />
      {locks.collectionLockRead.data ? "Unlock" : "Lock"} Wallet
      {Boolean(locks.collectionLockReadGlobal.data) &&
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
  const selectedUseCase = ALL_USE_CASES[locks.lockUseCaseIndex];
  const selectedUseCaseLocked =
    getLockStatus(locks.useCaseLockStatuses.data, locks.lockUseCaseIndex) ===
    true;
  const selectedUseCaseLockedGlobally =
    getLockStatus(
      locks.useCaseLockStatusesGlobal.data,
      locks.lockUseCaseIndex
    ) === true;
  const canManageSelectedUseCase = !selectedUseCaseLockedGlobally;
  const selectedUseCaseAction = selectedUseCaseLocked ? "Unlock" : "Lock";
  const selectedUseCaseActionInProgress = selectedUseCaseLocked
    ? "Unlocking"
    : "Locking";
  let useCaseAction: ReactNode;

  if (!selectedUseCase) {
    useCaseAction = (
      <div
        className="tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-sm tw-text-error"
        role="alert"
      >
        This use case is unavailable. Select another use case and try again.
      </div>
    );
  } else if (!canManageSelectedUseCase) {
    useCaseAction = (
      <div className="tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-sm tw-text-iron-300">
        <span className="tw-font-semibold tw-text-white">Note:</span> Unlock use
        case in{" "}
        <Link
          className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300"
          href={`/delegation/${ANY_COLLECTION_PATH}`}
        >
          All Collections
        </Link>
      </div>
    );
  } else {
    useCaseAction = (
      <button
        type="button"
        className={PRIMARY_ACTION_CLASS}
        onClick={() => {
          const title = `${selectedUseCaseActionInProgress} Wallet on Use Case #${selectedUseCase.use_case} - ${selectedUseCase.display}`;
          let toast: DelegationToastState = {
            status: "confirm_wallet",
            title,
          };
          locks.setUseCaseLockToastTitle(title);

          if (chainsMatch()) {
            locks.useCaseLockWrite.writeContract({
              address: DELEGATION_CONTRACT.contract,
              abi: DELEGATION_ABI,
              chainId: DELEGATION_CONTRACT.chain_id,
              args: [
                collection.contract,
                locks.lockUseCaseValue,
                !selectedUseCaseLocked,
              ],
              functionName: "setCollectionUsecaseLock",
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
          icon={selectedUseCaseLocked ? faLock : faLockOpen}
          className={BUTTON_ICON_CLASS}
        />
        {selectedUseCaseAction} Use Case
        {(locks.useCaseLockWrite.isPending ||
          locks.waitUseCaseLockWrite.isLoading) && <Spinner />}
      </button>
    );
  }

  return (
    <section className="tw-mt-6 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-4 sm:tw-p-6">
      <div>
        <h2 className="tw-mb-2 tw-mt-0 tw-flex tw-items-center tw-text-xl tw-font-semibold tw-text-white">
          Locks
          <FontAwesomeIcon
            className="tw-ml-2 tw-h-4 tw-w-4 tw-cursor-help tw-text-iron-400"
            icon={faInfoCircle}
            data-tooltip-id="locks-info"
          />
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
        </h2>
        <p className="tw-mb-5 tw-text-base tw-leading-6 tw-text-iron-300">
          Locks block incoming delegations for this collection scope. They do
          not stop delegations you already made to other wallets.
        </p>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-4">
        <div>
          <CollectionWalletLockButton {...props} />
        </div>
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-3">
          <div className="md:tw-col-span-1">
            <select
              aria-label="Lock or unlock use case"
              disabled={
                Boolean(locks.collectionLockRead.data) ||
                Boolean(locks.collectionLockReadGlobal.data)
              }
              className={LOCK_SELECT_CLASS}
              value={locks.lockUseCaseValue}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value);
                locks.setLockUseCaseValue(value);
                locks.setLockUseCaseIndex(getLockUseCaseIndex(value));
                locks.setUseCaseLockToastTitle("Locking Wallet");
                locks.useCaseLockWrite.reset();
              }}
            >
              <option value={0}>
                Lock/Unlock Use Case
                {Boolean(locks.collectionLockRead.data) ||
                Boolean(locks.collectionLockReadGlobal.data)
                  ? ` *`
                  : ``}
              </option>
              <CollectionLockUseCaseOptions locks={locks} />
            </select>
          </div>
          {locks.lockUseCaseValue !== 0 && (
            <div className="tw-flex tw-items-center md:tw-col-span-2">
              {useCaseAction}
            </div>
          )}
        </div>
      </div>
      {locks.collectionLockRead.data ? (
        <div className="tw-mt-4 tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-sm tw-text-iron-300">
          <span className="tw-font-semibold tw-text-white">Note:</span> Unlock
          Wallet to lock/unlock specific use cases
        </div>
      ) : null}
      {locks.collectionLockReadGlobal?.data ? (
        <div className="tw-mt-4 tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-sm tw-text-iron-300">
          <span className="tw-font-semibold tw-text-white">Note:</span> Unlock
          Wallet on{" "}
          <Link
            className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300"
            href={`/delegation/${ANY_COLLECTION_PATH}`}
          >
            All Collections
          </Link>{" "}
          to lock/unlock specific collections and use cases
        </div>
      ) : null}
    </section>
  );
}
