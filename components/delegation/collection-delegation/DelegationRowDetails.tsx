"use client";

import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import type { ContractWalletDelegation } from "../CollectionDelegation.utils";
import DelegationWallet from "../DelegationWallet";

/**
 * The wallet/expiry/consolidation-status details shown inside every
 * outgoing and incoming delegation row.
 */
export function DelegationRowDetails(
  props: Readonly<{
    label: string;
    walletDelegation: ContractWalletDelegation;
    consolidationStatus: string | undefined;
    pending: boolean;
    isConsolidation: boolean;
  }>
) {
  const { label, walletDelegation: w } = props;
  const { consolidationStatus, pending, isConsolidation } = props;

  return (
    <span className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1.5">
      <DelegationWallet address={w.wallet} />
      <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-sm">
        <span className="tw-text-iron-300">
          {w.all ? `all tokens` : ` - token ID: ${w.tokens}`}
        </span>
        <span
          className={`tw-font-semibold ${
            w.expiry === "expired" ? "tw-text-error" : "tw-text-success"
          }`}
        >
          {w.expiry}
        </span>
        {isConsolidation && (
          <span
            className={`tw-inline-flex tw-items-center tw-font-semibold ${
              pending ? "tw-text-amber-300" : "tw-text-primary-300"
            }`}
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
                  style={{
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "4px 8px",
                  }}
                >
                  {label} consolidation missing
                </Tooltip>
              </>
            )}
          </span>
        )}
      </span>
    </span>
  );
}
