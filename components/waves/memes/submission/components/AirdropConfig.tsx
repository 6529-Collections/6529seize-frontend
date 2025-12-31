"use client";

import React, { useCallback, useMemo } from "react";
import FormSection from "../ui/FormSection";
import { TraitWrapper } from "../../traits/TraitWrapper";
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
            className="tw-flex tw-items-start tw-gap-x-3"
          >
            {/* Address input */}
            <TraitWrapper
              label="Wallet Address"
              id={`airdrop-${index}-address`}
              error={getAddressError(entry.address)}
              isFieldFilled={!!entry.address && !getAddressError(entry.address)}
              className="tw-flex-1"
            >
              <input
                type="text"
                placeholder="0x..."
                value={entry.address}
                onChange={(e) => handleAddressChange(index, e.target.value)}
                className={`tw-form-input tw-w-full tw-rounded-lg tw-px-4 tw-py-3 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 ${
                  getAddressError(entry.address) ? "tw-ring-red" : "tw-ring-iron-700"
                } focus:tw-ring-primary-400`}
              />
            </TraitWrapper>

            {/* Count input */}
            <TraitWrapper
              label="Count"
              id={`airdrop-${index}-count`}
              isFieldFilled={!!entry.count}
              className="tw-w-24"
            >
              <input
                type="number"
                min="1"
                max={AIRDROP_TOTAL}
                value={entry.count || ""}
                onChange={(e) => handleCountChange(index, e.target.value)}
                className="tw-form-input tw-w-full tw-rounded-lg tw-px-4 tw-py-3 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 tw-ring-iron-700 focus:tw-ring-primary-400"
              />
            </TraitWrapper>

            {/* Remove button - only show when more than 1 entry */}
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveEntry(index)}
                className="tw-bg-transparent tw-border-0 tw-p-2 tw-mt-2 tw-text-iron-400 desktop-hover:hover:tw-text-rose-400 tw-cursor-pointer tw-transition-colors tw-duration-300 tw-ease-out"
                aria-label={`Remove address ${index + 1}`}
              >
                <TrashIcon className="tw-w-5 tw-h-5 tw-flex-shrink-0" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Address button */}
      <button
        type="button"
        onClick={handleAddEntry}
        className="tw-bg-transparent tw-border-0 tw-flex tw-items-center tw-gap-x-1.5 tw-mt-4 tw-text-sm tw-font-semibold tw-text-primary-400 desktop-hover:hover:tw-text-primary-300 tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out"
      >
        <PlusIcon className="tw-w-4 tw-h-4 tw-flex-shrink-0" />
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
