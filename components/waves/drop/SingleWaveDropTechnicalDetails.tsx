"use client";

import { useAuth } from "@/components/auth/Auth";
import CopyIcon from "@/components/utils/icons/CopyIcon";
import EnsAddressDisplay from "@/components/utils/input/ens-address/EnsAddressDisplay";
import { MemesSubmissionAdditionalInfoKey } from "@/components/waves/memes/submission/types/OperationalData";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useId, useMemo, useState } from "react";
import { Tooltip } from "react-tooltip";

interface AirdropEntry {
  readonly address: string;
  readonly count: number;
}

interface AllowlistBatch {
  readonly contract: string;
  readonly tokenIds: string;
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

const parseJson = <T,>(raw: string | undefined, fallback: T): T => {
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const parseAirdropConfig = (raw: string | undefined): AirdropEntry[] => {
  const parsed = parseJson<unknown>(raw, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((entry) => {
      const record = entry as { address?: unknown; count?: unknown };
      const address =
        typeof record?.address === "string" ? record.address.trim() : "";
      const countValue =
        typeof record?.count === "number"
          ? record.count
          : Number(record?.count);

      if (!address || !Number.isFinite(countValue) || countValue <= 0) {
        return null;
      }

      return { address, count: countValue };
    })
    .filter(isPresent);
};

interface PaymentDetails {
  readonly address: string;
  readonly designatedPayeeName: string;
}

const parsePaymentDetails = (raw: string | undefined): PaymentDetails => {
  const parsed = parseJson<unknown>(raw, null);
  if (!parsed || typeof parsed !== "object") {
    return { address: "", designatedPayeeName: "" };
  }
  const record = parsed as {
    payment_address?: unknown;
    has_designated_payee?: unknown;
    designated_payee_name?: unknown;
  };
  const address =
    typeof record.payment_address === "string"
      ? record.payment_address.trim()
      : "";
  const hasDesignatedPayee = record.has_designated_payee === true;
  const designatedPayeeName =
    hasDesignatedPayee && typeof record.designated_payee_name === "string"
      ? record.designated_payee_name.trim()
      : "";
  return { address, designatedPayeeName };
};

const parseAllowlistBatches = (raw: string | undefined): AllowlistBatch[] => {
  const parsed = parseJson<unknown>(raw, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((batch) => {
      const record = batch as {
        contract?: unknown;
        token_ids?: unknown;
        token_ids_raw?: unknown;
      };
      const contract =
        typeof record?.contract === "string" ? record.contract.trim() : "";
      let tokenIds = "";
      if (typeof record?.token_ids === "string") {
        tokenIds = record.token_ids.trim();
      } else if (Array.isArray(record?.token_ids)) {
        tokenIds = record.token_ids.join(", ");
      } else if (typeof record?.token_ids_raw === "string") {
        tokenIds = record.token_ids_raw.trim();
      }

      if (!contract) {
        return null;
      }

      return { contract, tokenIds };
    })
    .filter(isPresent);
};

interface SingleWaveDropTechnicalDetailsProps {
  readonly drop: ExtendedDrop;
}

export const SingleWaveDropTechnicalDetails = ({
  drop,
}: SingleWaveDropTechnicalDetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setToast } = useAuth();
  const tooltipId = useMemo(() => `technical-copy-${drop.id}`, [drop.id]);
  const copyToClipboard = useCallback(
    (value: string) => {
      if (!value) {
        return;
      }
      const writeText = navigator?.clipboard?.writeText;
      if (!writeText) {
        setToast({
          message: "Unable to copy to clipboard.",
          type: "error",
        });
        return;
      }
      writeText
        .call(navigator.clipboard, value)
        .then(() => {
          setToast({
            message: "Copied to clipboard.",
            type: "success",
          });
        })
        .catch(() => {
          setToast({
            message: "Unable to copy to clipboard.",
            type: "error",
          });
        });
    },
    [setToast]
  );

  const { paymentDetails, airdropEntries, allowlistBatches } = useMemo(() => {
    const metadata = drop.metadata ?? [];
    const getEntryValue = (key: MemesSubmissionAdditionalInfoKey) =>
      metadata.find((item) => item.data_key === key)?.data_value;

    return {
      paymentDetails: parsePaymentDetails(
        getEntryValue(MemesSubmissionAdditionalInfoKey.PAYMENT_INFO)
      ),
      airdropEntries: parseAirdropConfig(
        getEntryValue(MemesSubmissionAdditionalInfoKey.AIRDROP_CONFIG)
      ),
      allowlistBatches: parseAllowlistBatches(
        getEntryValue(MemesSubmissionAdditionalInfoKey.ALLOWLIST_BATCHES)
      ),
    };
  }, [drop.metadata]);

  const hasDetails =
    Boolean(paymentDetails.address) ||
    airdropEntries.length > 0 ||
    allowlistBatches.length > 0;

  const panelId = useId();
  const buttonId = `${panelId}-toggle`;

  if (!hasDetails) {
    return null;
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        id={buttonId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={`tw-flex tw-w-full tw-items-center tw-justify-between tw-border-0 tw-px-4 tw-py-4 tw-text-left tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-900 ${
          isOpen ? "tw-bg-iron-800" : "tw-bg-iron-950"
        }`}
      >
        <span
          className={`tw-text-sm tw-font-medium ${
            isOpen ? "tw-text-iron-300" : "tw-text-iron-400"
          }`}
        >
          Technical details
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDownIcon
            className={`tw-h-4 tw-w-4 tw-flex-shrink-0 ${
              isOpen ? "tw-text-iron-400" : "tw-text-iron-600"
            }`}
          />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="tw-overflow-hidden"
          >
            <div className="tw-space-y-6 tw-bg-iron-950 tw-px-4 tw-py-4 tw-text-xs">
              {paymentDetails.address && (
                <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/40 tw-p-4">
                  <div className="tw-mb-3 tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-iron-500">
                    Payment Address
                    {paymentDetails.designatedPayeeName && (
                      <span className="tw-ml-1 tw-text-white">
                        &ndash; Designated Payee: <span className="tw-normal-case">{paymentDetails.designatedPayeeName}</span>
                      </span>
                    )}
                  </div>
                  <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-3 tw-py-2 tw-font-mono tw-text-xs tw-font-medium tw-text-iron-200">
                    <div className="tw-min-w-0 tw-flex-1 tw-break-all">
                      <EnsAddressDisplay address={paymentDetails.address} />
                    </div>
                    <button
                      onClick={() => copyToClipboard(paymentDetails.address)}
                      className="tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-1.5 tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-800/60 hover:tw-text-iron-200"
                      title="Copy address"
                      data-tooltip-id={tooltipId}
                      data-tooltip-content="Copy"
                    >
                      <span className="tw-inline-flex tw-scale-75">
                        <CopyIcon />
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {airdropEntries.length > 0 && (
                <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-900/40 tw-p-4">
                  <div className="tw-mb-3 tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-iron-500">
                    Airdrop
                  </div>
                  <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-rounded-lg tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-900">
                    {airdropEntries.map((entry, index) => (
                      <div
                        key={`${entry.address}-${index}`}
                        className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-px-3 tw-py-3"
                      >
                        <div className="tw-min-w-0 tw-flex-1 tw-break-all tw-font-mono tw-text-xs tw-font-medium tw-text-iron-200">
                          <EnsAddressDisplay address={entry.address} />
                        </div>
                        <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2">
                          <div className="tw-font-medium tw-text-iron-400">
                            ×{entry.count}
                          </div>
                          <button
                            onClick={() => copyToClipboard(entry.address)}
                            className="tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-1.5 tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-800/60 hover:tw-text-iron-200"
                            title="Copy address"
                            data-tooltip-id={tooltipId}
                            data-tooltip-content="Copy"
                          >
                            <span className="tw-inline-flex tw-scale-75">
                              <CopyIcon />
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allowlistBatches.length > 0 && (
                <div className="tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-900/40 tw-p-4">
                  <div className="tw-mb-3 tw-text-[10px] tw-uppercase tw-tracking-wide tw-text-iron-500">
                    Allowlist
                  </div>
                  <div className="tw-space-y-3">
                    {allowlistBatches.map((batch, index) => (
                      <div
                        key={`${batch.contract}-${index}`}
                        className="tw-space-y-2 tw-rounded-lg tw-bg-iron-900 tw-p-3"
                      >
                        <div>
                          <div className="tw-text-[10px] tw-text-iron-500">
                            Contract Address
                          </div>
                          <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
                            <div className="tw-line-clamp-1 tw-break-all tw-font-mono tw-text-xs tw-font-medium tw-text-iron-200">
                              {batch.contract}
                            </div>
                            <button
                              onClick={() => copyToClipboard(batch.contract)}
                              className="tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-1.5 tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-800/60 hover:tw-text-iron-200"
                              title="Copy address"
                              data-tooltip-id={tooltipId}
                              data-tooltip-content="Copy"
                            >
                              <span className="tw-inline-flex tw-scale-75">
                                <CopyIcon />
                              </span>
                            </button>
                          </div>
                        </div>
                        {batch.tokenIds && (
                          <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-2">
                            <div className="tw-mb-2 tw-text-[10px] tw-text-iron-500">
                              Token IDs
                            </div>
                            <div className="tw-font-mono tw-text-xs tw-font-medium tw-text-iron-200">
                              {batch.tokenIds}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Tooltip
        id={tooltipId}
        place="top"
        offset={8}
        opacity={1}
        positionStrategy="fixed"
        style={{
          background: "#37373E",
          color: "white",
          padding: "4px 8px",
          fontSize: "12px",
          fontWeight: 500,
          borderRadius: "6px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          zIndex: 99999,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
