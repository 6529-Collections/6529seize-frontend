"use client";

import React, { useCallback } from "react";
import FormSection from "../ui/FormSection";
import { TraitWrapper } from "../../traits/TraitWrapper";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { AllowlistBatchRaw } from "../types/OperationalData";

export type { AllowlistBatchRaw };

interface AllowlistBatchManagerProps {
  readonly batches: AllowlistBatchRaw[];
  readonly onBatchesChange: (batches: AllowlistBatchRaw[]) => void;
  readonly errors?: { contract?: string; token_ids?: string }[];
}

const AllowlistBatchManager: React.FC<AllowlistBatchManagerProps> = ({
  batches,
  onBatchesChange,
  errors,
}) => {
  const handleAddBatch = useCallback(() => {
    onBatchesChange([...batches, { contract: "", token_ids_raw: "" }]);
  }, [batches, onBatchesChange]);

  const handleRemoveBatch = useCallback(
    (index: number) => {
      const newBatches = [...batches];
      newBatches.splice(index, 1);
      onBatchesChange(newBatches);
    },
    [batches, onBatchesChange]
  );

  const handleBatchChange = useCallback(
    (index: number, field: keyof AllowlistBatchRaw, value: string) => {
      const newBatches = [...batches];
      const currentBatch = newBatches[index];
      if (!currentBatch) {
        return;
      }
      newBatches[index] = { ...currentBatch, [field]: value };
      onBatchesChange(newBatches);
    },
    [batches, onBatchesChange]
  );

  return (
    <FormSection title="Allowlist Configuration">
      <div className="tw-flex tw-flex-col tw-gap-y-4">
        {batches.length === 0 ? (
          <div className="tw-text-sm tw-text-iron-500 tw-italic tw-py-2">
            No allowlist batches added.
          </div>
        ) : (
          batches.map((batch, index) => (
            <div
              key={index}
              className="tw-flex tw-items-start tw-gap-x-3"
            >
              {/* Contract Address */}
              <TraitWrapper
                label="Contract Address"
                id={`batch-${index}-contract`}
                error={errors?.[index]?.contract}
                isFieldFilled={!!batch.contract && !errors?.[index]?.contract}
                className="tw-flex-1"
              >
                <input
                  type="text"
                  placeholder="0x..."
                  value={batch.contract ?? ""}
                  onChange={(e) => handleBatchChange(index, "contract", e.target.value)}
                  className={`tw-form-input tw-w-full tw-rounded-lg tw-pl-4 tw-pr-11 tw-truncate tw-py-3 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 ${
                    errors?.[index]?.contract ? "tw-ring-red" : "tw-ring-iron-700"
                  } focus:tw-ring-primary-400`}
                />
              </TraitWrapper>

              {/* Token IDs */}
              <TraitWrapper
                label="Token IDs (e.g. 1,2,5-10)"
                id={`batch-${index}-token-ids`}
                error={errors?.[index]?.token_ids}
                isFieldFilled={!!batch.token_ids_raw && !errors?.[index]?.token_ids}
                className="tw-flex-1"
              >
                <input
                  type="text"
                  placeholder="Optional"
                  value={batch.token_ids_raw ?? ""}
                  onChange={(e) => handleBatchChange(index, "token_ids_raw", e.target.value)}
                  className={`tw-form-input tw-w-full tw-rounded-lg tw-pl-4 tw-pr-11 tw-truncat tw-py-3 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 ${
                    errors?.[index]?.token_ids ? "tw-ring-red" : "tw-ring-iron-700"
                  } focus:tw-ring-primary-400`}
                />
              </TraitWrapper>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveBatch(index)}
                className="tw-bg-transparent tw-border-0 tw-p-2 tw-mt-2 tw-text-iron-400 desktop-hover:hover:tw-text-rose-400 tw-cursor-pointer tw-transition-colors tw-duration-300 tw-ease-out"
                aria-label={`Remove Batch ${index + 1}`}
              >
                <TrashIcon className="tw-w-5 tw-h-5 tw-flex-shrink-0" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Batch button */}
      <button
        type="button"
        onClick={handleAddBatch}
        className="tw-bg-transparent tw-border-0 tw-flex tw-items-center tw-gap-x-1.5 tw-mt-4 tw-text-sm tw-font-semibold tw-text-primary-400 desktop-hover:hover:tw-text-primary-300 tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out"
      >
        <PlusIcon className="tw-w-4 tw-h-4 tw-flex-shrink-0" />
        Add Batch
      </button>
    </FormSection>
  );
};

export default React.memo(AllowlistBatchManager);
