"use client";

import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import styles from "../Delegation.module.css";
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
    <span className="tw-flex tw-flex-col tw-gap-1">
      <DelegationWallet address={w.wallet} />
      <span className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-text-[#9a9a9a]">
          {w.all ? `all tokens` : ` - token ID: ${w.tokens}`}
        </span>
        <span
          className={
            w.expiry === "expired"
              ? styles["delegationExpiredLabel"]
              : styles["delegationActiveLabel"]
          }
        >
          {w.expiry}
        </span>
        {isConsolidation && (
          <span
            className={
              pending
                ? styles["consolidationNotAcceptedLabel"]
                : styles["consolidationActiveLabel"]
            }
          >
            {consolidationStatus}
            {pending && (
              <>
                <FontAwesomeIcon
                  className={styles["infoIcon"]}
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
