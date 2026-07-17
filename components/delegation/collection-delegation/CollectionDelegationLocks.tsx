"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { DELEGATION_ABI } from "@/abis/abis";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
} from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
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
  const locale = useBrowserLocale();

  return ALL_USE_CASES.map((useCase, index) => {
    if (useCase.use_case === 1) return null;
    const isLockedGlobally =
      getLockStatus(props.locks.useCaseLockStatusesGlobal.data, index) === true;
    const isLocked =
      getLockStatus(props.locks.useCaseLockStatuses.data, index) === true;
    const lockDisplay =
      isLocked ||
      isLockedGlobally ||
      Boolean(props.locks.collectionLockRead.data)
        ? t(locale, "delegation.collection.locks.option.locked", {
            useCase: useCase.use_case,
            name: useCase.display,
            globalMarker: isLockedGlobally ? " *" : "",
          })
        : t(locale, "delegation.collection.locks.option.unlocked", {
            useCase: useCase.use_case,
            name: useCase.display,
          });

    return (
      <option
        key={`collection-delegation-select-use-case-${useCase.use_case}`}
        value={useCase.use_case}
      >
        {lockDisplay}
      </option>
    );
  });
}

function CollectionWalletLockButton(
  props: Readonly<CollectionDelegationLocksProps>
) {
  const locale = useBrowserLocale();
  const { collection, locks, chainsMatch, getSwitchToMessage } = props;
  const { showDelegationToast } = props;

  return (
    <button
      type="button"
      disabled={Boolean(locks.collectionLockReadGlobal.data)}
      className={PRIMARY_ACTION_CLASS}
      onClick={() => {
        const title = t(
          locale,
          locks.collectionLockRead.data
            ? "delegation.collection.toast.unlockingWallet"
            : "delegation.collection.toast.lockingWallet"
        );
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
      {t(
        locale,
        locks.collectionLockRead.data
          ? "delegation.collection.locks.wallet.unlock"
          : "delegation.collection.locks.wallet.lock"
      )}
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
  const locale = useBrowserLocale();
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
  const collectionLocked =
    Boolean(locks.collectionLockRead.data) ||
    Boolean(locks.collectionLockReadGlobal.data);
  const canManageSelectedUseCase =
    !collectionLocked && !selectedUseCaseLockedGlobally;
  let useCaseAction: ReactNode;

  if (!selectedUseCase) {
    useCaseAction = (
      <div
        className="tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-sm tw-text-error"
        role="alert"
      >
        {t(locale, "delegation.collection.locks.useCase.unavailable")}
      </div>
    );
  } else if (collectionLocked) {
    useCaseAction = null;
  } else if (!canManageSelectedUseCase) {
    useCaseAction = (
      <div className="tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-sm tw-text-iron-300">
        <span className="tw-font-semibold tw-text-white">
          {t(locale, "delegation.collection.locks.note.label")}
        </span>{" "}
        {t(locale, "delegation.collection.locks.useCase.globalNotePrefix")}{" "}
        <Link
          className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300"
          href={`/delegation/${ANY_COLLECTION_PATH}`}
        >
          {t(locale, "delegation.collection.locks.allCollections")}
        </Link>
      </div>
    );
  } else {
    useCaseAction = (
      <button
        type="button"
        className={PRIMARY_ACTION_CLASS}
        onClick={() => {
          const title = t(
            locale,
            selectedUseCaseLocked
              ? "delegation.collection.toast.unlockingUseCase"
              : "delegation.collection.toast.lockingUseCase",
            {
              useCase: selectedUseCase.use_case,
              useCaseName: selectedUseCase.display,
            }
          );
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
        {t(
          locale,
          selectedUseCaseLocked
            ? "delegation.collection.locks.useCase.unlock"
            : "delegation.collection.locks.useCase.lock"
        )}
        {(locks.useCaseLockWrite.isPending ||
          locks.waitUseCaseLockWrite.isLoading) && <Spinner />}
      </button>
    );
  }

  return (
    <section className="tw-mt-6 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-4 sm:tw-p-6">
      <div>
        <h2 className="tw-mb-2 tw-mt-0 tw-flex tw-items-center tw-text-xl tw-font-semibold tw-text-white">
          {t(locale, "delegation.collection.locks.title")}
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
            {t(locale, "delegation.collection.locks.tooltip")}
          </Tooltip>
        </h2>
        <p className="tw-mb-5 tw-text-base tw-leading-6 tw-text-iron-300">
          {t(locale, "delegation.collection.locks.description")}
        </p>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-4">
        <div>
          <CollectionWalletLockButton {...props} />
        </div>
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-3">
          <div className="md:tw-col-span-1">
            <select
              aria-label={t(
                locale,
                "delegation.collection.locks.useCase.ariaLabel"
              )}
              disabled={collectionLocked}
              className={LOCK_SELECT_CLASS}
              value={locks.lockUseCaseValue}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value);
                locks.setLockUseCaseValue(value);
                locks.setLockUseCaseIndex(getLockUseCaseIndex(value));
                locks.setUseCaseLockToastTitle(
                  t(locale, "delegation.collection.toast.lockingWallet")
                );
                locks.useCaseLockWrite.reset();
              }}
            >
              <option value={0}>
                {t(locale, "delegation.collection.locks.useCase.placeholder")}
                {Boolean(locks.collectionLockRead.data) ||
                Boolean(locks.collectionLockReadGlobal.data)
                  ? ` *`
                  : ``}
              </option>
              <CollectionLockUseCaseOptions locks={locks} />
            </select>
          </div>
          {locks.lockUseCaseValue !== 0 && useCaseAction && (
            <div className="tw-flex tw-items-center md:tw-col-span-2">
              {useCaseAction}
            </div>
          )}
        </div>
      </div>
      {locks.collectionLockRead.data ? (
        <div className="tw-mt-4 tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-sm tw-text-iron-300">
          <span className="tw-font-semibold tw-text-white">
            {t(locale, "delegation.collection.locks.note.label")}
          </span>{" "}
          {t(locale, "delegation.collection.locks.note.local")}
        </div>
      ) : null}
      {locks.collectionLockReadGlobal?.data ? (
        <div className="tw-mt-4 tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-sm tw-text-iron-300">
          <span className="tw-font-semibold tw-text-white">
            {t(locale, "delegation.collection.locks.note.label")}
          </span>{" "}
          {t(locale, "delegation.collection.locks.note.globalPrefix")}{" "}
          <Link
            className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300"
            href={`/delegation/${ANY_COLLECTION_PATH}`}
          >
            {t(locale, "delegation.collection.locks.allCollections")}
          </Link>{" "}
          {t(locale, "delegation.collection.locks.note.globalSuffix")}
        </div>
      ) : null}
    </section>
  );
}
