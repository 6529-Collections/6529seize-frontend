"use client";

import React, { useCallback, useMemo, useState } from "react";
import FormSection from "../ui/FormSection";
import { TraitWrapper } from "../../traits/TraitWrapper";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { type AirdropEntry, AIRDROP_TOTAL } from "../types/OperationalData";
import { validateStrictAddress } from "../utils/addressValidation";
import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";

interface AirdropConfigProps {
  readonly entries: AirdropEntry[];
  readonly onEntriesChange: (entries: AirdropEntry[]) => void;
}

const AirdropConfig: React.FC<AirdropConfigProps> = ({
  entries,
  onEntriesChange,
}) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [ensErrorStates, setEnsErrorStates] = useState<Record<string, boolean>>(
    {}
  );

  const totalAllocated = useMemo(
    () => entries.reduce((sum, e) => sum + (e.count || 0), 0),
    [entries]
  );

  const remaining = AIRDROP_TOTAL - totalAllocated;
  const firstEntry = entries[0];

  const getAddressError = useCallback(
    (entryId: string, address: string): string | null => {
      if (ensErrorStates[entryId]) return "Could not resolve ENS name";
      if (!address) return null;
      return validateStrictAddress(address)
        ? null
        : "Invalid address (0x... 42 chars)";
    },
    [ensErrorStates]
  );

  const handleAddEntry = useCallback(() => {
    const defaultCount = Math.max(0, remaining);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    onEntriesChange([...entries, { id, address: "", count: defaultCount }]);
  }, [entries, onEntriesChange, remaining]);

  const handleRemoveEntry = useCallback(
    (index: number) => {
      if (entries.length <= 1) return;
      const entryToRemove = entries[index];
      const newEntries = [...entries];
      newEntries.splice(index, 1);
      onEntriesChange(newEntries);

      if (entryToRemove) {
        setLoadingStates((prev) => {
          const next = { ...prev };
          delete next[entryToRemove.id];
          return next;
        });
        setEnsErrorStates((prev) => {
          const next = { ...prev };
          delete next[entryToRemove.id];
          return next;
        });
      }
    },
    [entries, onEntriesChange]
  );

  const handleAddressChange = useCallback(
    (index: number, resolvedAddress: string) => {
      const newEntries = [...entries];
      const currentEntry = newEntries[index];
      if (!currentEntry) {
        return;
      }
      newEntries[index] = { ...currentEntry, address: resolvedAddress };
      onEntriesChange(newEntries);
    },
    [entries, onEntriesChange]
  );

  const handleLoadingChange = useCallback((entryId: string, isLoading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [entryId]: isLoading }));
  }, []);

  const handleEnsError = useCallback((entryId: string, hasError: boolean) => {
    setEnsErrorStates((prev) => ({ ...prev, [entryId]: hasError }));
  }, []);

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

      <div className="tw-flex tw-flex-col tw-gap-y-6">
        {entries.map((entry, index) => {
          const error = getAddressError(entry.id, entry.address);
          const isLoading = loadingStates[entry.id] ?? false;
          const isValid = !!entry.address && !error && !isLoading;

          return (
            <div key={entry.id} className="tw-flex tw-items-start tw-gap-x-3">
              <TraitWrapper
                label="Wallet Address *"
                id={`airdrop-${index}-address`}
                error={error}
                isFieldFilled={isValid}
                className="tw-flex-1 tw-pb-0"
              >
                <EnsAddressInput
                  value={entry.address}
                  placeholder="0x... or ENS"
                  onAddressChange={(addr) => handleAddressChange(index, addr)}
                  onLoadingChange={(loading) =>
                    handleLoadingChange(entry.id, loading)
                  }
                  onError={(hasError) => handleEnsError(entry.id, hasError)}
                  className={`tw-form-input tw-w-full tw-truncate tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-3 tw-pl-4 tw-pr-11 tw-text-sm tw-text-iron-100 tw-outline-none tw-ring-1 focus:tw-bg-iron-900 focus:tw-text-iron-100 ${
                    error ? "tw-ring-red" : "tw-ring-iron-700"
                  } focus:tw-ring-primary-400`}
                />
              </TraitWrapper>

              <TraitWrapper
                label="Count *"
                id={`airdrop-${index}-count`}
                isFieldFilled={!!entry.count}
                className="tw-w-24 tw-pb-0"
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
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleAddEntry}
        className="tw-mt-4 tw-flex tw-cursor-pointer tw-items-center tw-gap-x-1.5 tw-border-0 tw-bg-transparent tw-text-sm tw-font-semibold tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-primary-300"
      >
        <PlusIcon className="tw-size-4 tw-flex-shrink-0" />
        Add Address
      </button>

      {entries.length === 1 && !firstEntry?.address && (
        <p className="tw-mt-3 tw-text-xs tw-text-iron-500">
          Enter at least one wallet address to receive airdrops.
        </p>
      )}
    </FormSection>
  );
};

export default React.memo(AirdropConfig);
