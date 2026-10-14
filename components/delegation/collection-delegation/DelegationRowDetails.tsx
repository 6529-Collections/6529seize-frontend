"use client";

import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import type {
  ContractDelegationExpiry,
  ContractWalletDelegation,
} from "../CollectionDelegation.utils";
import {
  formatDelegationExpiryLocal,
  getViewerTimeZone,
} from "../delegation-expiry";
import DelegationWallet from "../DelegationWallet";

function getExpiryLabel(
  locale: SupportedLocale,
  expiry: ContractDelegationExpiry | undefined
) {
  if (!expiry) {
    return null;
  }
  switch (expiry.status) {
    case "nonExpiring":
      return t(locale, "delegation.collection.row.expiry.nonExpiring");
    case "expired":
      return t(locale, "delegation.collection.row.expiry.expired");
    case "active":
      return t(locale, "delegation.collection.row.expiry.active", {
        date: formatDelegationExpiryLocal(
          locale,
          expiry.expiresAt,
          getViewerTimeZone()
        ),
      });
  }
}

/**
 * The wallet/expiry/consolidation-status details shown inside every
 * outgoing and incoming delegation row.
 */
export function DelegationRowDetails(
  props: Readonly<{
    label: string;
    walletDelegation: ContractWalletDelegation;
    consolidationStatus: string | undefined;
    statusUnavailable: boolean;
    pending: boolean;
    isConsolidation: boolean;
  }>
) {
  const locale = useBrowserLocale();
  const { label, walletDelegation: w } = props;
  const { consolidationStatus, statusUnavailable, pending, isConsolidation } =
    props;
  let consolidationStatusClass = "tw-text-primary-300";
  if (statusUnavailable) {
    consolidationStatusClass = "tw-text-error";
  } else if (pending) {
    consolidationStatusClass = "tw-text-amber-300";
  }

  return (
    <span className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1.5">
      <DelegationWallet address={w.wallet} />
      <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-sm">
        <span className="tw-text-iron-300">
          {w.all
            ? t(locale, "delegation.collection.row.allTokens")
            : t(locale, "delegation.collection.row.tokenId", {
                tokens: String(w.tokens),
              })}
        </span>
        <span
          className={`tw-font-semibold ${
            w.expiry?.status === "expired" ? "tw-text-error" : "tw-text-success"
          }`}
        >
          {getExpiryLabel(locale, w.expiry)}
        </span>
        {isConsolidation && (
          <span
            className={`tw-inline-flex tw-items-center tw-font-semibold ${consolidationStatusClass}`}
          >
            {consolidationStatus}
            {pending && (
              <>
                <FontAwesomeIcon
                  className="tw-ml-2 tw-h-4 tw-w-4 tw-cursor-help"
                  icon={faInfoCircle}
                  data-tooltip-id={`consolidation-missing-${label}-${w.wallet}`}
                ></FontAwesomeIcon>
                <Tooltip
                  id={`consolidation-missing-${label}-${w.wallet}`}
                  style={TOOLTIP_STYLES}
                >
                  {t(locale, "delegation.collection.row.consolidationMissing", {
                    label,
                  })}
                </Tooltip>
              </>
            )}
          </span>
        )}
      </span>
    </span>
  );
}
