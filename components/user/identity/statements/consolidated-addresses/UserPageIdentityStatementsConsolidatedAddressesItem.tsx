"use client";

import { DELEGATION_ABI } from "@/abis/abis";
import { useAuth } from "@/components/auth/Auth";
import { PRIMARY_ADDRESS_USE_CASE } from "@/components/delegation/delegation-constants";
import EtherscanIcon from "@/components/user/utils/icons/EtherscanIcon";
import OpenseaIcon from "@/components/user/utils/icons/OpenseaIcon";
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
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Tooltip } from "react-tooltip";
import { useCopyToClipboard } from "react-use";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import UserPageIdentityStatementsConsolidatedAddressesItemPrimary from "./UserPageIdentityStatementsConsolidatedAddressesItemPrimary";

const PRIMARY_ERROR_TITLE_KEY =
  "user.profile.identity.statements.primaryErrorTitle" as const;

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

  const [copiedItem, setCopiedItem] = useState<"full-address" | "ens" | null>(
    null
  );
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [_, copyToClipboard] = useCopyToClipboard();

  const handleCopyAddress = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.stopPropagation();
    copyToClipboard(address.wallet);
    setCopiedItem("full-address");
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => {
      setCopiedItem((current) => (current === "full-address" ? null : current));
      resetTimerRef.current = null;
    }, 1000);
  };

  const handleCopyEns = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (!ensName) {
      return;
    }

    event.stopPropagation();
    copyToClipboard(ensName);
    setCopiedItem("ens");
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => {
      setCopiedItem((current) => (current === "ens" ? null : current));
      resetTimerRef.current = null;
    }, 1000);
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

  function getError(e: unknown) {
    const record = e as { message?: unknown } | null;
    const message =
      typeof record?.message === "string" ? record.message : "";
    return message.split("Request Arguments")[0] ?? "";
  }

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
        message: t(
          locale,
          "user.profile.identity.statements.primarySuccess"
        ),
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
        details: getToastErrorDetails(
          waitWriteDelegation.error,
          errorMessage
        ),
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

  let statusMessage: ReactNode = null;
  if (writeDelegation.isPending) {
    statusMessage = t(
      locale,
      "user.profile.identity.statements.confirmWallet"
    );
  } else if (writeDelegation.error) {
    statusMessage = (
      <>
        {t(locale, PRIMARY_ERROR_TITLE_KEY)} {getError(writeDelegation.error)}
      </>
    );
  } else if (writeDelegation.data && waitWriteDelegation.isLoading) {
    statusMessage = (
      <>
        {t(
          locale,
          "user.profile.identity.statements.waitingConfirmation"
        )}{" "}
        {transactionLink}
      </>
    );
  } else if (writeDelegation.data && waitWriteDelegation.data) {
    statusMessage = (
      <>
        {t(locale, "user.profile.identity.statements.primaryConfirmed")}{" "}
        {transactionLink}
      </>
    );
  } else if (waitWriteDelegation.error) {
    statusMessage = (
      <>
        {t(locale, PRIMARY_ERROR_TITLE_KEY)} {getError(waitWriteDelegation.error)}{" "}
        {transactionLink}
      </>
    );
  }

  let copiedAnnouncement = "";
  if (copiedItem === "full-address") {
    copiedAnnouncement = t(
      locale,
      "user.profile.identity.statements.addressCopied"
    );
  } else if (copiedItem === "ens") {
    copiedAnnouncement = t(
      locale,
      "user.profile.identity.statements.ensCopied"
    );
  }

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
      <div className="tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/30">
        <div className="tw-flex tw-items-center tw-gap-1 tw-px-1.5 tw-py-1 lg:tw-gap-2 lg:tw-px-3 lg:tw-py-2">
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
            className="tw-flex tw-min-h-11 tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1.5 tw-py-0.5 tw-text-left tw-text-iron-100 tw-transition-colors desktop-hover:hover:tw-bg-white/[0.04] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 lg:tw-min-h-0 lg:tw-px-0"
          >
            <span className="tw-min-w-0 tw-flex-1">
              {ensName && (
                <span className="tw-block tw-truncate tw-font-mono tw-text-sm tw-font-semibold tw-leading-4">
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
            <ChevronDownIcon
              className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-400 tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none lg:tw-hidden ${
                isOpen ? "tw-rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          <UserPageIdentityStatementsConsolidatedAddressesItemPrimary
            isPrimary={isPrimary}
            canEdit={canEdit}
            assignPrimary={assignPrimary}
            isAssigningPrimary={
              writeDelegation.isPending || waitWriteDelegation.isLoading
            }
          />

          <div className="tw-ml-auto tw-hidden tw-flex-shrink-0 tw-items-center tw-gap-1.5 lg:tw-flex">
            <a
              href={`https://etherscan.io/address/${address.wallet}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(
                locale,
                "user.profile.identity.statements.openEtherscan"
              )}
              className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-md tw-text-iron-500 tw-transition-colors hover:tw-bg-white/5 hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              data-tooltip-id={`etherscan-tooltip-${address.wallet}`}
              data-tooltip-content={
                isTouchScreen
                  ? null
                  : t(
                      locale,
                      "user.profile.identity.statements.openEtherscan"
                    )
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
              className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-md tw-text-iron-500 tw-transition-colors hover:tw-bg-white/5 hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              data-tooltip-id={`opensea-tooltip-${address.wallet}`}
              data-tooltip-content={
                isTouchScreen
                  ? null
                  : t(
                      locale,
                      "user.profile.identity.statements.openOpenSea"
                    )
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
              className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-500 tw-transition hover:tw-bg-white/5 hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
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
            className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-px-3 tw-pb-3 tw-pt-2"
          >
            <div className="tw-space-y-2.5">
              <div>
                <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                  {t(locale, "user.profile.identity.statements.fullAddress")}
                </div>
                <div className="tw-mt-1 tw-flex tw-min-h-11 tw-items-center tw-justify-between tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/40 tw-pl-3 tw-pr-1">
                  <span className="tw-min-w-0 tw-break-all tw-font-mono tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-100">
                    {address.wallet}
                  </span>
                  <button
                    type="button"
                    aria-label={t(
                      locale,
                      "user.profile.identity.statements.copyFullAddress"
                    )}
                    onClick={handleCopyAddress}
                    className={`tw-flex tw-h-11 tw-w-11 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-transition hover:tw-bg-white/5 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 lg:tw-h-7 lg:tw-w-7 lg:tw-rounded ${
                      copiedItem === "full-address"
                        ? "tw-text-primary-400"
                        : "tw-text-iron-400 hover:tw-text-iron-200"
                    }`}
                  >
                    <div className="tw-flex tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-items-center tw-justify-center [&>svg]:tw-h-full [&>svg]:tw-w-full">
                      <CopyIcon />
                    </div>
                  </button>
                </div>
              </div>

              {ensName && (
                <div>
                  <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
                    {t(locale, "user.profile.identity.statements.ensName")}
                  </div>
                  <div className="tw-mt-1 tw-flex tw-min-h-11 tw-items-center tw-justify-between tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/40 tw-pl-3 tw-pr-1">
                    <span className="tw-min-w-0 tw-break-all tw-font-mono tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-100">
                      {ensName}
                    </span>
                    <button
                      type="button"
                      aria-label={t(
                        locale,
                        "user.profile.identity.statements.copyEnsName"
                      )}
                      onClick={handleCopyEns}
                      className={`tw-flex tw-h-11 tw-w-11 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-transition hover:tw-bg-white/5 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 lg:tw-h-7 lg:tw-w-7 lg:tw-rounded ${
                        copiedItem === "ens"
                          ? "tw-text-primary-400"
                          : "tw-text-iron-400 hover:tw-text-iron-200"
                      }`}
                    >
                      <div className="tw-flex tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-items-center tw-justify-center [&>svg]:tw-h-full [&>svg]:tw-w-full">
                        <CopyIcon />
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="tw-grid tw-grid-cols-2 tw-gap-2 lg:tw-hidden">
                <a
                  href={`https://etherscan.io/address/${address.wallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.05] tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-100 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                >
                  <span className="tw-h-4 tw-w-4" aria-hidden="true">
                    <EtherscanIcon />
                  </span>
                  {t(
                    locale,
                    "user.profile.identity.statements.openEtherscan"
                  )}
                </a>
                <a
                  href={`https://opensea.io/${address.wallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.05] tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-100 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                >
                  <span className="tw-h-4 tw-w-4" aria-hidden="true">
                    <OpenseaIcon />
                  </span>
                  {t(
                    locale,
                    "user.profile.identity.statements.openOpenSea"
                  )}
                </a>
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
