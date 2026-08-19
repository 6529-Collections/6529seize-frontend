"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { DELEGATION_ABI } from "@/abis/abis";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import Button from "@/components/utils/button/Button";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
} from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  faInfoCircle,
  faLock,
  faLockOpen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { DelegationCollection } from "../delegation-constants";
import { ALL_USE_CASES, ANY_COLLECTION_PATH } from "../delegation-constants";
import type { DelegationToastState } from "../DelegationToast";
import {
  BUTTON_ICON_CLASS,
  COLLECTION_PANEL_CLASS,
  COLLECTION_PANEL_ICON_CLASS,
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

function getCollectionLockUseCaseItems(
  locks: CollectionLocks,
  locale: SupportedLocale
): CommonSelectItem<number>[] {
  const placeholder = t(
    locale,
    "delegation.collection.locks.useCase.placeholder"
  );
  const collectionLockMarker =
    Boolean(locks.collectionLockRead.data) ||
    Boolean(locks.collectionLockReadGlobal.data)
      ? " *"
      : "";
  const items: CommonSelectItem<number>[] = [
    {
      key: "collection-delegation-select-use-case-0",
      label: `${placeholder}${collectionLockMarker}`,
      value: 0,
    },
  ];

  for (const [index, useCase] of ALL_USE_CASES.entries()) {
    if (useCase.use_case === 1) continue;
    const isLockedGlobally =
      getLockStatus(locks.useCaseLockStatusesGlobal.data, index) === true;
    const isLocked =
      getLockStatus(locks.useCaseLockStatuses.data, index) === true;
    const lockDisplay =
      isLocked || isLockedGlobally || Boolean(locks.collectionLockRead.data)
        ? t(locale, "delegation.collection.locks.option.locked", {
            useCase: useCase.use_case,
            name: useCase.display,
            globalMarker: isLockedGlobally ? " *" : "",
          })
        : t(locale, "delegation.collection.locks.option.unlocked", {
            useCase: useCase.use_case,
            name: useCase.display,
          });

    items.push({
      key: `collection-delegation-select-use-case-${useCase.use_case}`,
      label: lockDisplay,
      value: useCase.use_case,
    });
  }

  return items;
}

function CollectionWalletLockButton(
  props: Readonly<CollectionDelegationLocksProps>
) {
  const locale = useBrowserLocale();
  const { collection, locks, chainsMatch, getSwitchToMessage } = props;
  const { showDelegationToast } = props;

  return (
    <PrimaryButton
      disabled={Boolean(locks.collectionLockReadGlobal.data)}
      loading={
        locks.collectionLockWrite.isPending ||
        locks.waitCollectionLockWrite.isLoading
      }
      size="lg"
      onClicked={() => {
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
        className={`-tw-ml-1 ${BUTTON_ICON_CLASS}`}
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
    </PrimaryButton>
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
  const lockUseCaseItems = getCollectionLockUseCaseItems(locks, locale);
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
      <Button
        type="button"
        loading={
          locks.useCaseLockWrite.isPending ||
          locks.waitUseCaseLockWrite.isLoading
        }
        variant="primary"
        size="lg"
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
      </Button>
    );
  }

  return (
    <section className={`tw-mt-4 ${COLLECTION_PANEL_CLASS}`}>
      <div className="tw-mb-5 tw-flex tw-items-start tw-gap-4">
        <span className={COLLECTION_PANEL_ICON_CLASS} aria-hidden="true">
          <FontAwesomeIcon icon={faLock} className="tw-size-4" />
        </span>
        <div className="tw-min-w-0">
          <div className="tw-flex tw-items-center tw-gap-1">
            <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-text-iron-100">
              {t(locale, "delegation.collection.locks.title")}
            </h2>
            <TooltipIconButton
              icon={faInfoCircle}
              tooltipText={t(locale, "delegation.collection.locks.tooltip")}
              tooltipWidth="tw-w-64"
              buttonSizeClassName="tw-size-8"
              buttonShapeClassName="tw-rounded-lg"
              className="tw-text-iron-400 tw-transition-colors hover:tw-bg-white/[0.05] hover:tw-text-iron-200"
              iconClassName="tw-size-4 tw-text-current"
            />
          </div>
          <p className="tw-mb-0 tw-mt-1 tw-max-w-4xl tw-text-base tw-leading-6 tw-text-iron-400">
            {t(locale, "delegation.collection.locks.description")}
          </p>
        </div>
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-3 sm:tw-grid-cols-[max-content_minmax(0,32rem)]">
        <CollectionWalletLockButton {...props} />
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3">
          <CommonDropdown
            items={lockUseCaseItems}
            activeItem={locks.lockUseCaseValue}
            filterLabel={t(
              locale,
              "delegation.collection.locks.useCase.ariaLabel"
            )}
            disabled={collectionLocked}
            theme="dark"
            size="md"
            setSelected={(value) => {
              locks.setLockUseCaseValue(value);
              locks.setLockUseCaseIndex(getLockUseCaseIndex(value));
              locks.setUseCaseLockToastTitle(
                t(locale, "delegation.collection.toast.lockingWallet")
              );
              locks.useCaseLockWrite.reset();
            }}
          />
          {locks.lockUseCaseValue !== 0 && useCaseAction && (
            <div className="tw-flex tw-items-center">{useCaseAction}</div>
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
