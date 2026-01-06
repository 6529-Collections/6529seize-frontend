"use client";

import React, { useCallback, useMemo } from "react";
import FormSection from "../ui/FormSection";
import { TraitWrapper } from "../../traits/TraitWrapper";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { type AirdropEntry, AIRDROP_TOTAL } from "../types/OperationalData";
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
  const firstEntry = entries[0];

  const getAddressError = (address: string): string | null => {
    if (!address) return null;
    return validateStrictAddress(address)
      ? null
      : "Invalid address (0x... 42 chars)";
  };

  const handleAddEntry = useCallback(() => {
    // Default new entry to remaining count (or 0 if over)
    const defaultCount = Math.max(0, remaining);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    onEntriesChange([...entries, { id, address: "", count: defaultCount }]);
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
      const currentEntry = newEntries[index];
      if (!currentEntry) {
        return;
      }
      newEntries[index] = { ...currentEntry, address: value };
      onEntriesChange(newEntries);
    },
    [entries, onEntriesChange]
  );

  const handleCountChange = useCallback(
    (index: number, value: string) => {
      const newEntries = [...entries];
      const currentEntry = newEntries[index];
      if (!currentEntry) {
        return;
      }
      const numVal = Number.parseInt(value, 10);
      newEntries[index] = {
        ...currentEntry,
        count: Number.isNaN(numVal) ? 0 : Math.max(0, numVal),
      };
      onEntriesChange(newEntries);
    },
    [entries, onEntriesChange]
  );

  const isOverAllocated = totalAllocated > AIRDROP_TOTAL;
  const isUnderAllocated = totalAllocated < AIRDROP_TOTAL;
  const isExactlyAllocated = totalAllocated === AIRDROP_TOTAL;

  const getSummaryBarClasses = () => {
    if (isExactlyAllocated)
      return "tw-bg-green/10 tw-border tw-border-green/30";
    if (isOverAllocated) return "tw-bg-red/10 tw-border tw-border-red/30";
    return "tw-bg-iron-800/50 tw-border tw-border-iron-700";
  };

  const getTotalTextColorClass = () => {
    if (isOverAllocated) return "tw-text-red";
    if (isExactlyAllocated) return "tw-text-green";
    return "tw-text-iron-100";
  };

  return (
    <FormSection title="Airdrop Distribution">
      {/* Summary bar */}
      <div
        className={`tw-mb-4 tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-px-4 tw-py-3 ${getSummaryBarClasses()}`}
      >
        <span className="tw-text-sm tw-text-iron-300">
          Total allocated:{" "}
          <span className={`tw-font-bold ${getTotalTextColorClass()}`}>
            {totalAllocated}
          </span>{" "}
          / {AIRDROP_TOTAL}
        </span>
        {isOverAllocated && (
          <span className="tw-text-sm tw-font-medium tw-text-red">
            {Math.abs(remaining)} over limit
          </span>
        )}
        {isUnderAllocated && (
          <span className="tw-text-sm tw-text-iron-400">
            {remaining} remaining
          </span>
        )}
        {isExactlyAllocated && (
          <span className="tw-text-sm tw-font-medium tw-text-green">
            Complete
          </span>
        )}
      </div>

      <div className="tw-flex tw-flex-col tw-gap-y-4">
        {entries.map((entry, index) => (
          <div key={entry.id} className="tw-flex tw-items-start tw-gap-x-3">
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
                className={`tw-form-input tw-w-full tw-truncate tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-3 tw-pl-4 tw-pr-11 tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 ${
                  getAddressError(entry.address)
                    ? "tw-ring-red"
                    : "tw-ring-iron-700"
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
                min="0"
                max={AIRDROP_TOTAL}
                value={entry.count || ""}
                onChange={(e) => handleCountChange(index, e.target.value)}
                className="tw-form-input tw-w-full tw-truncate tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-3 tw-pl-4 tw-pr-11 tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 tw-ring-iron-700 focus:tw-ring-primary-400"
              />
            </TraitWrapper>

            {/* Remove button - only show when more than 1 entry */}
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveEntry(index)}
                className="tw-mt-2 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-2 tw-text-iron-400 tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-rose-400"
                aria-label={`Remove address ${index + 1}`}
              >
                <TrashIcon className="tw-size-5 tw-flex-shrink-0" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Address button */}
      <button
        type="button"
        onClick={handleAddEntry}
        className="tw-mt-4 tw-flex tw-cursor-pointer tw-items-center tw-gap-x-1.5 tw-border-0 tw-bg-transparent tw-text-sm tw-font-semibold tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-primary-300"
      >
        <PlusIcon className="tw-size-4 tw-flex-shrink-0" />
        Add Address
      </button>

      {/* Validation hint */}
      {entries.length === 1 && !firstEntry?.address && (
        <p className="tw-mt-3 tw-text-xs tw-text-iron-500">
          Enter at least one wallet address to receive airdrops.
        </p>
      )}
    </FormSection>
  );
};

export default React.memo(AirdropConfig);
