"use client";

import React, { useCallback, useMemo } from "react";
import FormSection from "../ui/FormSection";
import ValidationError from "../ui/ValidationError";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { AirdropEntry, AIRDROP_TOTAL } from "../types/OperationalData";
import { validateStrictAddress } from "../utils/addressValidation";

interface AirdropConfigProps {
  readonly entries: AirdropEntry[];
  readonly onEntriesChange: (entries: AirdropEntry[]) => void;
}

const AirdropConfig: React.FC<AirdropConfigProps> = ({
  entries,
  onEntriesChange,
}) => {
  const totalAllocated = useMemo(
    () => entries.reduce((sum, e) => sum + (e.count || 0), 0),
    [entries]
  );

  const remaining = AIRDROP_TOTAL - totalAllocated;

  const getAddressError = (address: string): string | null => {
    if (!address) return null;
    return validateStrictAddress(address) ? null : "Invalid address (0x... 42 chars)";
  };

  const handleAddEntry = useCallback(() => {
    // Default new entry to remaining count (or 0 if over)
    const defaultCount = Math.max(0, remaining);
    onEntriesChange([...entries, { address: "", count: defaultCount }]);
  }, [entries, onEntriesChange, remaining]);

  const handleRemoveEntry = useCallback(
    (index: number) => {
      if (entries.length <= 1) return; // Keep at least one
      const newEntries = [...entries];
      newEntries.splice(index, 1);
      onEntriesChange(newEntries);
    },
    [entries, onEntriesChange]
  );

  const handleAddressChange = useCallback(
    (index: number, value: string) => {
      const newEntries = [...entries];
      newEntries[index] = { ...newEntries[index], address: value };
      onEntriesChange(newEntries);
    },
    [entries, onEntriesChange]
  );

  const handleCountChange = useCallback(
    (index: number, value: string) => {
      const newEntries = [...entries];
      const numVal = parseInt(value, 10);
      newEntries[index] = { ...newEntries[index], count: isNaN(numVal) ? 0 : Math.max(0, numVal) };
      onEntriesChange(newEntries);
    },
    [entries, onEntriesChange]
  );

  const isOverAllocated = totalAllocated > AIRDROP_TOTAL;
  const isUnderAllocated = totalAllocated < AIRDROP_TOTAL;
  const isExactlyAllocated = totalAllocated === AIRDROP_TOTAL;

  return (
    <FormSection title="Airdrop Distribution">
      {/* Summary bar */}
      <div className={`tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-rounded-lg tw-mb-4 ${
        isExactlyAllocated
          ? "tw-bg-green/10 tw-border tw-border-green/30"
          : isOverAllocated
            ? "tw-bg-red/10 tw-border tw-border-red/30"
            : "tw-bg-iron-800/50 tw-border tw-border-iron-700"
      }`}>
        <span className="tw-text-sm tw-text-iron-300">
          Total allocated: <span className={`tw-font-bold ${isOverAllocated ? "tw-text-red" : isExactlyAllocated ? "tw-text-green" : "tw-text-iron-100"}`}>{totalAllocated}</span> / {AIRDROP_TOTAL}
        </span>
        {isOverAllocated && (
          <span className="tw-text-sm tw-text-red tw-font-medium">
            {Math.abs(remaining)} over limit
          </span>
        )}
        {isUnderAllocated && (
          <span className="tw-text-sm tw-text-iron-400">
            {remaining} remaining
          </span>
        )}
        {isExactlyAllocated && (
          <span className="tw-text-sm tw-text-green tw-font-medium">
            Complete
          </span>
        )}
      </div>

      <div className="tw-flex tw-flex-col tw-gap-y-4">
        {entries.map((entry, index) => (
          <div
            key={index}
            className="tw-flex tw-items-center tw-gap-x-3"
          >
            {/* Address input */}
            <div className="tw-flex-1 tw-group tw-relative">
              <div className="tw-relative">
                <label
                  htmlFor={`airdrop-${index}-address`}
                  className={`tw-absolute tw-left-3 -tw-top-2 tw-px-1 tw-text-xs tw-font-medium tw-bg-iron-900 tw-z-10 ${
                    getAddressError(entry.address) ? "tw-text-red" : "tw-text-iron-300"
                  }`}
                >
                  Wallet Address
                </label>
                <input
                  id={`airdrop-${index}-address`}
                  type="text"
                  placeholder="0x..."
                  value={entry.address}
                  onChange={(e) => handleAddressChange(index, e.target.value)}
                  className={`tw-form-input tw-w-full tw-rounded-lg tw-px-4 tw-py-3 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 ${
                    getAddressError(entry.address) ? "tw-ring-red" : "tw-ring-iron-700"
                  } focus:tw-ring-primary-400`}
                />
              </div>
              <ValidationError error={getAddressError(entry.address)} />
            </div>

            {/* Count input */}
            <div className="tw-w-24 tw-group tw-relative">
              <div className="tw-relative">
                <label
                  htmlFor={`airdrop-${index}-count`}
                  className="tw-absolute tw-left-3 -tw-top-2 tw-px-1 tw-text-xs tw-font-medium tw-bg-iron-900 tw-z-10 tw-text-iron-300"
                >
                  Count
                </label>
                <input
                  id={`airdrop-${index}-count`}
                  type="number"
                  min="1"
                  max={AIRDROP_TOTAL}
                  value={entry.count || ""}
                  onChange={(e) => handleCountChange(index, e.target.value)}
                  className="tw-form-input tw-w-full tw-rounded-lg tw-px-4 tw-py-3 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 tw-ring-iron-700 focus:tw-ring-primary-400"
                />
              </div>
            </div>

            {/* Remove button - only show when more than 1 entry */}
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveEntry(index)}
                className="tw-p-2 tw-text-iron-500 hover:tw-text-red tw-transition-colors"
                aria-label={`Remove address ${index + 1}`}
              >
                <TrashIcon className="tw-w-5 tw-h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Address button */}
      <button
        type="button"
        onClick={handleAddEntry}
        className="tw-flex tw-items-center tw-gap-x-1.5 tw-mt-4 tw-text-sm tw-font-semibold tw-text-primary-400 hover:tw-text-primary-300 tw-transition-colors"
      >
        <PlusIcon className="tw-w-4 tw-h-4" />
        Add Address
      </button>

      {/* Validation hint */}
      {entries.length === 1 && !entries[0].address && (
        <p className="tw-text-xs tw-text-iron-500 tw-mt-3">
          Enter at least one wallet address to receive airdrops.
        </p>
      )}
    </FormSection>
  );
};

export default React.memo(AirdropConfig);
