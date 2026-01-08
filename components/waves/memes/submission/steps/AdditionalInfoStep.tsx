"use client";

import type { FC } from "react";
import { motion } from "framer-motion";
import AirdropConfig from "../components/AirdropConfig";
import AllowlistBatchManager, { AllowlistBatchRaw } from "../components/AllowlistBatchManager";
import AdditionalMediaUpload from "../components/AdditionalMediaUpload";
import { validateStrictAddress } from "../utils/addressValidation";
import { validateTokenIdFormat } from "../utils/tokenParsing";
import { AirdropEntry, AIRDROP_TOTAL } from "../types/OperationalData";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";

interface AdditionalInfoStepProps {
  readonly airdropEntries: AirdropEntry[];
  readonly onAirdropEntriesChange: (entries: AirdropEntry[]) => void;
  readonly allowlistBatches: AllowlistBatchRaw[];
  readonly artworkCommentaryMedia: string[];
  readonly artworkCommentary: string;
  readonly onBatchesChange: (batches: AllowlistBatchRaw[]) => void;
  readonly onArtworkCommentaryMediaChange: (media: string[]) => void;
  readonly onArtworkCommentaryChange: (commentary: string) => void;
  readonly onBack: () => void;
  readonly onSubmit: () => void;
  readonly isSubmitting: boolean;
}

const AdditionalInfoStep: FC<AdditionalInfoStepProps> = ({
  airdropEntries,
  onAirdropEntriesChange,
  allowlistBatches,
  artworkCommentaryMedia,
  artworkCommentary,
  onBatchesChange,
  onArtworkCommentaryMediaChange,
  onArtworkCommentaryChange,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  const getContractError = (address: string) => {
    // Only show error if user has typed something invalid
    // Empty fields are handled by submit button being disabled
    if (!address) return undefined;
    if (!validateStrictAddress(address)) return "Invalid contract address";
    return undefined;
  };

  const getTokenIdsError = (tokenIds: string) => {
    return validateTokenIdFormat(tokenIds) || undefined;
  };

  const isFormValid = () => {
    // Validate airdrop entries
    const hasInvalidCount = airdropEntries.some(
      (e) => !Number.isFinite(e.count) || e.count < 0 || !Number.isInteger(e.count)
    );
    if (hasInvalidCount) return false;

    const totalAllocated = airdropEntries.reduce((sum, e) => sum + (e.count ?? 0), 0);
    if (totalAllocated !== AIRDROP_TOTAL) return false;

    // Every entry with count > 0 must have a valid address
    const hasEntryWithCountButNoValidAddress = airdropEntries.some(
      (e) => e.count > 0 && (!e.address || !validateStrictAddress(e.address))
    );
    if (hasEntryWithCountButNoValidAddress) return false;

    // Every entry with a valid address must have count > 0
    const hasEntryWithAddressButNoCount = airdropEntries.some(
      (e) => e.address && validateStrictAddress(e.address) && (!e.count || e.count <= 0)
    );
    if (hasEntryWithAddressButNoCount) return false;

    // All provided addresses must be valid (even if count is 0)
    const hasInvalidAddress = airdropEntries.some(
      (e) => e.address && !validateStrictAddress(e.address)
    );
    if (hasInvalidAddress) return false;

    // Check allowlist batches - contract is required if batch exists
    const hasInvalidBatch = allowlistBatches.some(
      (batch) => !batch.contract || !validateStrictAddress(batch.contract)
    );
    if (hasInvalidBatch) return false;

    // Check token ID format
    const hasInvalidTokenIds = allowlistBatches.some(
      (batch) => validateTokenIdFormat(batch.token_ids_raw) !== null
    );
    if (hasInvalidTokenIds) return false;

    return true;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tw-flex tw-flex-col tw-h-full tw-max-w-4xl tw-mx-auto tw-pb-8"
    >
      <div className="tw-flex-1 tw-overflow-y-auto tw-px-4 tw-py-2 tw-space-y-8 tw-scrollbar-thin tw-scrollbar-thumb-iron-700 tw-scrollbar-track-iron-900">
        <p className="tw-text-sm tw-text-iron-400">
          Complete the following details for distribution and storytelling purposes.
        </p>

        <AirdropConfig
          entries={airdropEntries}
          onEntriesChange={onAirdropEntriesChange}
        />

        <AllowlistBatchManager
          batches={allowlistBatches}
          onBatchesChange={onBatchesChange}
          errors={allowlistBatches.map((batch) => {
            const contractError = getContractError(batch.contract);
            const tokenIdsError = getTokenIdsError(batch.token_ids_raw);
            return {
              ...(contractError ? { contract: contractError } : {}),
              ...(tokenIdsError ? { token_ids: tokenIdsError } : {}),
            };
          })}
        />

        <AdditionalMediaUpload
          artworkCommentaryMedia={artworkCommentaryMedia}
          artworkCommentary={artworkCommentary}
          onArtworkCommentaryMediaChange={onArtworkCommentaryMediaChange}
          onArtworkCommentaryChange={onArtworkCommentaryChange}
        />
      </div>

      <div className="tw-flex tw-items-center tw-justify-between tw-pt-6 tw-px-4 tw-border-t tw-border-iron-800 tw-mt-auto">
        <SecondaryButton
          onClicked={onBack}
          disabled={isSubmitting}
        >
          Back
        </SecondaryButton>
        <PrimaryButton
          onClicked={onSubmit}
          disabled={!isFormValid()}
          loading={isSubmitting}
          padding="tw-px-6 tw-py-3"
        >
          Submit Artwork
        </PrimaryButton>
      </div>
    </motion.div>
  );
};

export default AdditionalInfoStep;
