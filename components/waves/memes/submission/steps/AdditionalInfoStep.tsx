"use client";

import React from "react";
import { motion } from "framer-motion";
import AirdropAddressFields from "../components/AirdropAddressFields";
import AllowlistBatchManager, { AllowlistBatchRaw } from "../components/AllowlistBatchManager";
import AdditionalMediaUpload from "../components/AdditionalMediaUpload";
import { validateStrictAddress } from "../utils/addressValidation";

interface AdditionalInfoStepProps {
  readonly airdropArtistAddress: string;
  readonly airdropArtistCount: number;
  readonly airdropChoiceAddress: string;
  readonly airdropChoiceCount: number;
  readonly allowlistBatches: AllowlistBatchRaw[];
  readonly artistProfileMedia: string[];
  readonly artworkCommentaryMedia: string[];
  readonly artworkCommentary: string;
  readonly onArtistAddressChange: (address: string) => void;
  readonly onArtistCountChange: (count: number) => void;
  readonly onChoiceAddressChange: (address: string) => void;
  readonly onChoiceCountChange: (count: number) => void;
  readonly onBatchesChange: (batches: AllowlistBatchRaw[]) => void;
  readonly onArtistProfileMediaChange: (media: string[]) => void;
  readonly onArtworkCommentaryMediaChange: (media: string[]) => void;
  readonly onArtworkCommentaryChange: (commentary: string) => void;
  readonly onBack: () => void;
  readonly onSubmit: () => void;
  readonly isSubmitting: boolean;
}

const AdditionalInfoStep: React.FC<AdditionalInfoStepProps> = ({
  airdropArtistAddress,
  airdropArtistCount,
  airdropChoiceAddress,
  airdropChoiceCount,
  allowlistBatches,
  artistProfileMedia,
  artworkCommentaryMedia,
  artworkCommentary,
  onArtistAddressChange,
  onArtistCountChange,
  onChoiceAddressChange,
  onChoiceCountChange,
  onBatchesChange,
  onArtistProfileMediaChange,
  onArtworkCommentaryMediaChange,
  onArtworkCommentaryChange,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  const getAddressError = (address: string) => {
    return address && !validateStrictAddress(address)
      ? "Invalid Ethereum address (0x... 42 chars)"
      : null;
  };

  const getContractError = (address: string) => {
    return address && !validateStrictAddress(address) ? "Invalid contract" : undefined;
  };

  const isFormValid = () => {
    // Check main addresses
    if (airdropArtistAddress && !validateStrictAddress(airdropArtistAddress)) return false;
    if (airdropChoiceAddress && !validateStrictAddress(airdropChoiceAddress)) return false;

    // Check allowlist batches
    const hasInvalidBatch = allowlistBatches.some(
      (batch) => batch.contract && !validateStrictAddress(batch.contract)
    );
    if (hasInvalidBatch) return false;

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

        <AirdropAddressFields
          airdropArtistAddress={airdropArtistAddress}
          airdropArtistCount={airdropArtistCount}
          airdropChoiceAddress={airdropChoiceAddress}
          airdropChoiceCount={airdropChoiceCount}
          onArtistAddressChange={onArtistAddressChange}
          onArtistCountChange={onArtistCountChange}
          onChoiceAddressChange={onChoiceAddressChange}
          onChoiceCountChange={onChoiceCountChange}
          artistAddressError={getAddressError(airdropArtistAddress)}
          choiceAddressError={getAddressError(airdropChoiceAddress)}
        />

        <AllowlistBatchManager
          batches={allowlistBatches}
          onBatchesChange={onBatchesChange}
          errors={allowlistBatches.map((b) => ({
            contract: getContractError(b.contract),
          }))}
        />

        <AdditionalMediaUpload
          artistProfileMedia={artistProfileMedia}
          artworkCommentaryMedia={artworkCommentaryMedia}
          artworkCommentary={artworkCommentary}
          onArtistProfileMediaChange={onArtistProfileMediaChange}
          onArtworkCommentaryMediaChange={onArtworkCommentaryMediaChange}
          onArtworkCommentaryChange={onArtworkCommentaryChange}
        />
      </div>

      <div className="tw-flex tw-items-center tw-justify-between tw-pt-6 tw-px-4 tw-border-t tw-border-iron-800 tw-mt-auto">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-300 hover:tw-text-iron-100 tw-transition-colors disabled:tw-opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !isFormValid()}
          className="tw-inline-flex tw-items-center tw-justify-center tw-px-8 tw-py-3 tw-text-sm tw-font-bold tw-text-white tw-bg-primary-500 hover:tw-bg-primary-600 disabled:tw-bg-iron-800 disabled:tw-text-iron-500 tw-rounded-xl tw-transition-all tw-duration-300"
        >
          {isSubmitting ? "Submitting..." : "Submit Artwork"}
        </button>
      </div>
    </motion.div>
  );
};

export default AdditionalInfoStep;
