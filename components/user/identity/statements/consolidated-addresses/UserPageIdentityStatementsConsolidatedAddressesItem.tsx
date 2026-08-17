"use client";

import { DELEGATION_ABI } from "@/abis/abis";
import { useAuth } from "@/components/auth/Auth";
import { PRIMARY_ADDRESS_USE_CASE } from "@/components/delegation/delegation-constants";
import EtherscanIcon from "@/components/user/utils/icons/EtherscanIcon";
import OpenseaIcon from "@/components/user/utils/icons/OpenseaIcon";
import ButtonLink from "@/components/utils/button/ButtonLink";
import CopyIcon from "@/components/utils/icons/CopyIcon";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  NEVER_DATE,
} from "@/constants/constants";
import type { ApiWallet } from "@/generated/models/ApiWallet";
import { getTransactionLink } from "@/helpers/Helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
  type PointerEvent,
  type PointerEventHandler,
  type ReactNode,
} from "react";
import { Tooltip } from "react-tooltip";
import { useCopyToClipboard } from "react-use";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import UserPageIdentityStatementsConsolidatedAddressesItemPrimary from "./UserPageIdentityStatementsConsolidatedAddressesItemPrimary";

const PRIMARY_ERROR_TITLE_KEY =
  "user.profile.identity.statements.primaryErrorTitle" as const;
const COPIED_FEEDBACK_DURATION_MS = 1800;
const FULL_ADDRESS_COPY_ITEM = "full-address" as const;
const ENS_COPY_ITEM = "ens" as const;
type CopiedItem = typeof FULL_ADDRESS_COPY_ITEM | typeof ENS_COPY_ITEM;

function getError(error: unknown): string {
  const record = error as { message?: unknown } | null;
  const message = typeof record?.message === "string" ? record.message : "";
  return message.split("Request Arguments")[0] ?? "";
}

function getDelegationStatusMessage({
  locale,
  isWritePending,
  writeError,
  hasWriteData,
  isReceiptLoading,
  hasReceiptData,
  receiptError,
  transactionLink,
}: {
  readonly locale: ReturnType<typeof useBrowserLocale>;
  readonly isWritePending: boolean;
  readonly writeError: unknown;
  readonly hasWriteData: boolean;
  readonly isReceiptLoading: boolean;
  readonly hasReceiptData: boolean;
  readonly receiptError: unknown;
  readonly transactionLink: ReactNode;
}): ReactNode {
  if (isWritePending) {
    return t(locale, "user.profile.identity.statements.confirmWallet");
  }

  if (writeError !== undefined && writeError !== null) {
    return (
      <>
        {t(locale, PRIMARY_ERROR_TITLE_KEY)} {getError(writeError)}
      </>
    );
  }

  if (hasWriteData && isReceiptLoading) {
    return (
      <>
        {t(locale, "user.profile.identity.statements.waitingConfirmation")}{" "}
        {transactionLink}
      </>
    );
  }

  if (hasWriteData && hasReceiptData) {
    return (
      <>
        {t(locale, "user.profile.identity.statements.primaryConfirmed")}{" "}
        {transactionLink}
      </>
    );
  }

  if (receiptError !== undefined && receiptError !== null) {
    return (
      <>
        {t(locale, PRIMARY_ERROR_TITLE_KEY)} {getError(receiptError)}{" "}
        {transactionLink}
      </>
    );
  }

  return null;
}

function getCopiedAnnouncement(
  locale: ReturnType<typeof useBrowserLocale>,
  copiedItem: CopiedItem | null
): string {
  if (copiedItem === FULL_ADDRESS_COPY_ITEM) {
    return t(locale, "user.profile.identity.statements.addressCopied");
  }

  if (copiedItem === ENS_COPY_ITEM) {
    return t(locale, "user.profile.identity.statements.ensCopied");
  }

  return "";
}

function CopyValueField({
  label,
  value,
  copyLabel,
  copiedLabel,
  tooltipId,
  isCopied,
  isTouchScreen,
  onCopy,
  onPointerDown,
  onPointerCancel,
}: {
  readonly label: string;
  readonly value: string;
  readonly copyLabel: string;
  readonly copiedLabel: string;
  readonly tooltipId: string;
  readonly isCopied: boolean;
  readonly isTouchScreen: boolean;
  readonly onCopy: MouseEventHandler<HTMLButtonElement>;
  readonly onPointerDown: PointerEventHandler<HTMLButtonElement>;
  readonly onPointerCancel: PointerEventHandler<HTMLButtonElement>;
}) {
  const showCopiedFeedback = isTouchScreen && isCopied;

  return (
    <div>
      <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
        {label}
      </div>
      <button
        type="button"
        aria-label={copyLabel}
        onClick={onCopy}
        onPointerDown={onPointerDown}
        onPointerCancel={onPointerCancel}
        {...(!isTouchScreen && { "data-tooltip-id": tooltipId })}
        className="tw-group tw-relative tw-mt-1 tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-touch-manipulation tw-items-center tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-black/40 tw-py-2 tw-pl-2 tw-pr-12 tw-text-left tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white/[0.06] lg:tw-min-h-0 lg:tw-pr-9"
      >
        <span
          className={`tw-min-w-0 tw-break-all tw-font-mono tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-100 ${
            showCopiedFeedback ? "tw-invisible" : ""
          }`}
        >
          {value}
        </span>
        {showCopiedFeedback && (
          <span
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-2 tw-right-12 tw-flex tw-items-center tw-font-sans tw-text-xs tw-font-semibold tw-text-primary-400"
          >
            {copiedLabel}
          </span>
        )}
        <span
          aria-hidden="true"
          className={`tw-absolute tw-right-1 tw-top-1/2 tw-flex tw-h-11 tw-w-11 tw--translate-y-1/2 tw-items-center tw-justify-center tw-rounded-md tw-transition-colors lg:tw-h-7 lg:tw-w-7 lg:tw-rounded ${
            isCopied
              ? "tw-text-primary-400"
              : "tw-text-iron-400 group-focus-visible:tw-text-iron-200 desktop-hover:group-hover:tw-text-iron-200"
          }`}
        >
          <div className="tw-flex tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-items-center tw-justify-center [&>svg]:tw-h-full [&>svg]:tw-w-full">
            <CopyIcon />
          </div>
        </span>
      </button>
      {!isTouchScreen && (
        <Tooltip
          id={tooltipId}
          place="top"
          positionStrategy="fixed"
          offset={8}
          opacity={1}
          {...(isCopied && { isOpen: true })}
          style={TOOLTIP_STYLES}
        >
          <span className="tw-text-xs">
            {isCopied ? copiedLabel : copyLabel}
          </span>
        </Tooltip>
      )}
    </div>
  );
}

export default function UserPageIdentityStatementsConsolidatedAddressesItem({
  address,
  primaryAddress,
  canEdit,
  isOpen,
  onToggleOpen,
}: {
  readonly address: ApiWallet;
  readonly primaryAddress: string | null;
  readonly canEdit: boolean;
  readonly isOpen: boolean;
  readonly onToggleOpen: () => void;
}) {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const ensName = (() => {
    const value = address.display.trim();
    if (!value) {
      return null;
    }
    if (value.toLowerCase() === address.wallet.toLowerCase()) {
      return null;
    }
    return value.endsWith(".eth") ? value : null;
  })();

  const isPrimary =
    address.wallet.toLowerCase() === primaryAddress?.toLowerCase();

  const [copiedItem, setCopiedItem] = useState<CopiedItem | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [_, copyToClipboardLegacy] = useCopyToClipboard();

  const copyToClipboard = (value: string) => {
    const clipboard = globalThis.navigator.clipboard as Clipboard | undefined;
    if (!clipboard) {
      copyToClipboardLegacy(value);
      return;
    }

    void clipboard.writeText(value).catch(() => {
      copyToClipboardLegacy(value);
    });
  };

  const scheduleCopiedReset = (item: CopiedItem) => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => {
      setCopiedItem((current) => (current === item ? null : current));
      resetTimerRef.current = null;
    }, COPIED_FEEDBACK_DURATION_MS);
  };

  const showTouchCopyFeedback = (
    event: PointerEvent<HTMLButtonElement>,
    item: CopiedItem
  ) => {
    if (event.pointerType === "touch") {
      setCopiedItem(item);
      scheduleCopiedReset(item);
    }
  };

  const clearCanceledTouchCopyFeedback = (
    event: PointerEvent<HTMLButtonElement>,
    item: CopiedItem
  ) => {
    if (event.pointerType === "touch") {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      setCopiedItem((current) => (current === item ? null : current));
    }
  };

  const handleCopyAddress = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.stopPropagation();
    setCopiedItem(FULL_ADDRESS_COPY_ITEM);
    copyToClipboard(address.wallet);
    scheduleCopiedReset(FULL_ADDRESS_COPY_ITEM);
  };

  const handleCopyEns = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (!ensName) {
      return;
    }

    event.stopPropagation();
    setCopiedItem(ENS_COPY_ITEM);
    copyToClipboard(ensName);
    scheduleCopiedReset(ENS_COPY_ITEM);
  };

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const isTouchScreen = useIsTouchDevice();
  const writeDelegation = useWriteContract();
  const waitWriteDelegation = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: writeDelegation.data,
  });
  const lastToastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (writeDelegation.isPending || waitWriteDelegation.isLoading) {
      lastToastKeyRef.current = null;
      return;
    }

    if (writeDelegation.error) {
      const errorMessage = getError(writeDelegation.error);
      const toastKey = `write-error:${errorMessage}`;
      if (lastToastKeyRef.current === toastKey) {
        return;
      }
      lastToastKeyRef.current = toastKey;
      setToast({
        type: "error",
        title: t(locale, PRIMARY_ERROR_TITLE_KEY),
        description: t(
          locale,
          "user.profile.identity.statements.primaryErrorDescription"
        ),
        details: getToastErrorDetails(writeDelegation.error, errorMessage),
      });
      return;
    }

    if (writeDelegation.data && waitWriteDelegation.data) {
      const toastKey = `success:${writeDelegation.data}`;
      if (lastToastKeyRef.current === toastKey) {
        return;
      }
      lastToastKeyRef.current = toastKey;
      setToast({
        type: "success",
        message: t(locale, "user.profile.identity.statements.primarySuccess"),
      });
      return;
    }

    if (waitWriteDelegation.error) {
      const errorMessage = getError(waitWriteDelegation.error);
      const toastKey = `receipt-error:${errorMessage}`;
      if (lastToastKeyRef.current === toastKey) {
        return;
      }
      lastToastKeyRef.current = toastKey;
      setToast({
        type: "error",
        title: t(locale, PRIMARY_ERROR_TITLE_KEY),
        description: t(
          locale,
          "user.profile.identity.statements.primaryErrorDescription"
        ),
        details: getToastErrorDetails(waitWriteDelegation.error, errorMessage),
      });
    }
  }, [
    locale,
    setToast,
    waitWriteDelegation.data,
    waitWriteDelegation.error,
    waitWriteDelegation.isLoading,
    writeDelegation.data,
    writeDelegation.error,
    writeDelegation.isPending,
  ]);

  const transactionLink = writeDelegation.data ? (
    <a
      href={getTransactionLink(
        DELEGATION_CONTRACT.chain_id,
        writeDelegation.data
      )}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-text-primary-400 tw-underline"
    >
      {t(locale, "user.profile.identity.statements.viewTransaction")}
    </a>
  ) : null;

  const statusMessage = getDelegationStatusMessage({
    locale,
    isWritePending: writeDelegation.isPending,
    writeError: writeDelegation.error,
    hasWriteData: !!writeDelegation.data,
    isReceiptLoading: waitWriteDelegation.isLoading,
    hasReceiptData: !!waitWriteDelegation.data,
    receiptError: waitWriteDelegation.error,
    transactionLink,
  });
  const copiedAnnouncement = getCopiedAnnouncement(locale, copiedItem);
  const assignPrimary = async () => {
    writeDelegation.writeContract({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: "registerDelegationAddress",
      args: [
        DELEGATION_ALL_ADDRESS,
        address.wallet,
        NEVER_DATE,
        PRIMARY_ADDRESS_USE_CASE.use_case,
        true,
        0,
      ],
    });
  };

  return (
    <li>
      <div
        className={`tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-bg-iron-950/30 tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none ${
          isOpen ? "tw-border-white/20" : "tw-border-white/10"
        }`}
      >
        <div className="tw-flex tw-items-center tw-gap-1 tw-px-1.5 tw-py-1 lg:tw-gap-2 lg:tw-px-3">
          <button
            type="button"
            aria-label={t(
              locale,
              isOpen
                ? "user.profile.identity.statements.collapseAddress"
                : "user.profile.identity.statements.expandAddress"
            )}
            aria-expanded={isOpen}
            aria-controls={`consolidated-address-panel-${address.wallet}`}
            onClick={onToggleOpen}
            className="tw-flex tw-min-h-11 tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1.5 tw-py-0.5 tw-text-left tw-text-iron-100 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-white/40 desktop-hover:hover:tw-bg-white/[0.04] lg:tw-min-h-0 lg:tw-px-0"
          >
            <span className="tw-min-w-0 tw-flex-1">
              {ensName && (
                <span className="tw-block tw-truncate tw-font-mono tw-text-[13px] tw-font-semibold tw-leading-4">
                  {ensName}
                </span>
              )}
              <span
                className={`tw-block tw-font-mono tw-text-xs tw-font-medium tw-text-iron-400 ${
                  ensName ? "tw-mt-0.5" : ""
                }`}
              >
                {address.wallet.slice(0, 6)}…{address.wallet.slice(-4)}
              </span>
            </span>
          </button>

          <UserPageIdentityStatementsConsolidatedAddressesItemPrimary
            isPrimary={isPrimary}
            canEdit={canEdit}
            assignPrimary={assignPrimary}
            isAssigningPrimary={
              writeDelegation.isPending || waitWriteDelegation.isLoading
            }
          />

          <button
            type="button"
            aria-label={t(
              locale,
              isOpen
                ? "user.profile.identity.statements.collapseAddress"
                : "user.profile.identity.statements.expandAddress"
            )}
            aria-expanded={isOpen}
            aria-controls={`consolidated-address-panel-${address.wallet}`}
            onClick={onToggleOpen}
            className="tw-ml-1 tw-inline-flex tw-h-11 tw-w-11 tw-flex-shrink-0 tw-touch-manipulation tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-500 tw-transition hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-white/40 lg:tw-hidden"
          >
            <ChevronDownIcon
              className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${
                isOpen ? "tw-rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          <div className="tw-ml-auto tw-hidden tw-flex-shrink-0 tw-items-center tw-gap-1.5 lg:tw-flex">
            <a
              href={`https://etherscan.io/address/${address.wallet}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(
                locale,
                "user.profile.identity.statements.openEtherscan"
              )}
              className="tw-inline-flex tw-items-center tw-justify-center tw-p-0.5 tw-text-iron-500 tw-transition-colors hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              data-tooltip-id={`etherscan-tooltip-${address.wallet}`}
              data-tooltip-content={
                isTouchScreen
                  ? null
                  : t(locale, "user.profile.identity.statements.openEtherscan")
              }
            >
              <div className="tw-flex tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-items-center tw-justify-center">
                <EtherscanIcon />
              </div>
            </a>
            {!isTouchScreen && (
              <Tooltip
                id={`etherscan-tooltip-${address.wallet}`}
                place="top"
                positionStrategy="fixed"
                offset={8}
                opacity={1}
                style={TOOLTIP_STYLES}
              />
            )}
            <a
              href={`https://opensea.io/${address.wallet}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(
                locale,
                "user.profile.identity.statements.openOpenSea"
              )}
              className="tw-inline-flex tw-items-center tw-justify-center tw-p-0.5 tw-text-iron-500 tw-transition-colors hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              data-tooltip-id={`opensea-tooltip-${address.wallet}`}
              data-tooltip-content={
                isTouchScreen
                  ? null
                  : t(locale, "user.profile.identity.statements.openOpenSea")
              }
            >
              <div className="tw-flex tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-items-center tw-justify-center">
                <OpenseaIcon />
              </div>
            </a>
            {!isTouchScreen && (
              <Tooltip
                id={`opensea-tooltip-${address.wallet}`}
                place="top"
                positionStrategy="fixed"
                offset={8}
                opacity={1}
                style={TOOLTIP_STYLES}
              />
            )}
            <button
              type="button"
              aria-label={t(
                locale,
                isOpen
                  ? "user.profile.identity.statements.collapseAddress"
                  : "user.profile.identity.statements.expandAddress"
              )}
              aria-expanded={isOpen}
              aria-controls={`consolidated-address-panel-${address.wallet}`}
              onClick={onToggleOpen}
              className="tw-inline-flex tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0.5 tw-text-iron-500 tw-transition hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              <ChevronDownIcon
                className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${
                  isOpen ? "tw-rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {isOpen && (
          <div
            id={`consolidated-address-panel-${address.wallet}`}
            className="tw-px-3 tw-pb-3 tw-pt-1"
          >
            <div className="tw-space-y-2.5">
              <CopyValueField
                label={t(
                  locale,
                  "user.profile.identity.statements.fullAddress"
                )}
                value={address.wallet}
                copyLabel={t(
                  locale,
                  "user.profile.identity.statements.copyFullAddress"
                )}
                copiedLabel={t(
                  locale,
                  "user.profile.identity.statements.copied"
                )}
                tooltipId={`copy-address-tooltip-${address.wallet}`}
                isCopied={copiedItem === FULL_ADDRESS_COPY_ITEM}
                isTouchScreen={isTouchScreen}
                onCopy={handleCopyAddress}
                onPointerDown={(event) =>
                  showTouchCopyFeedback(event, FULL_ADDRESS_COPY_ITEM)
                }
                onPointerCancel={(event) =>
                  clearCanceledTouchCopyFeedback(event, FULL_ADDRESS_COPY_ITEM)
                }
              />

              {ensName && (
                <CopyValueField
                  label={t(locale, "user.profile.identity.statements.ensName")}
                  value={ensName}
                  copyLabel={t(
                    locale,
                    "user.profile.identity.statements.copyEnsName"
                  )}
                  copiedLabel={t(
                    locale,
                    "user.profile.identity.statements.copied"
                  )}
                  tooltipId={`copy-ens-tooltip-${address.wallet}`}
                  isCopied={copiedItem === ENS_COPY_ITEM}
                  isTouchScreen={isTouchScreen}
                  onCopy={handleCopyEns}
                  onPointerDown={(event) =>
                    showTouchCopyFeedback(event, ENS_COPY_ITEM)
                  }
                  onPointerCancel={(event) =>
                    clearCanceledTouchCopyFeedback(event, ENS_COPY_ITEM)
                  }
                />
              )}

              <div className="tw-grid tw-grid-cols-2 tw-gap-2 lg:tw-hidden">
                <ButtonLink
                  href={`https://etherscan.io/address/${address.wallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  variant="secondary"
                  size="xs"
                  fullWidth
                  aria-label={t(
                    locale,
                    "user.profile.identity.statements.openEtherscan"
                  )}
                >
                  <span className="tw-h-4 tw-w-4" aria-hidden="true">
                    <EtherscanIcon />
                  </span>
                  {t(locale, "user.profile.identity.statements.etherscan")}
                </ButtonLink>
                <ButtonLink
                  href={`https://opensea.io/${address.wallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  variant="secondary"
                  size="xs"
                  fullWidth
                  aria-label={t(
                    locale,
                    "user.profile.identity.statements.openOpenSea"
                  )}
                >
                  <span className="tw-h-4 tw-w-4" aria-hidden="true">
                    <OpenseaIcon />
                  </span>
                  {t(locale, "user.profile.identity.statements.openSea")}
                </ButtonLink>
              </div>
            </div>
            <span className="tw-sr-only" aria-live="polite">
              {copiedAnnouncement}
            </span>
          </div>
        )}
      </div>
      {statusMessage && (
        <div
          aria-live="polite"
          className="tw-pt-2 tw-text-xs tw-font-medium tw-text-iron-200"
        >
          {statusMessage}
        </div>
      )}
    </li>
  );
}
