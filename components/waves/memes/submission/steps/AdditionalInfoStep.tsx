"use client";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import { motion } from "framer-motion";
import type { FC } from "react";
import AdditionalMediaUpload from "../components/AdditionalMediaUpload";
import AirdropConfig from "../components/AirdropConfig";
import AllowlistBatchManager, {
  AllowlistBatchRaw,
} from "../components/AllowlistBatchManager";
import PaymentConfig from "../components/PaymentConfig";
import {
  AIRDROP_TOTAL,
  AirdropEntry,
  PaymentInfo,
} from "../types/OperationalData";
import { validateStrictAddress } from "../utils/addressValidation";
import { validateTokenIdFormat } from "../utils/tokenParsing";

interface AdditionalInfoStepProps {
  readonly airdropEntries: AirdropEntry[];
  readonly onAirdropEntriesChange: (entries: AirdropEntry[]) => void;
  readonly paymentInfo: PaymentInfo;
  readonly onPaymentInfoChange: (paymentInfo: PaymentInfo) => void;
  readonly allowlistBatches: AllowlistBatchRaw[];
  readonly supportingMedia: string[];
  readonly artworkCommentary: string;
  readonly aboutArtist: string;
  readonly previewImage: string;
  readonly requiresPreviewImage: boolean;
  readonly previewRequiredMediaType: string | null;
  readonly onBatchesChange: (batches: AllowlistBatchRaw[]) => void;
  readonly onSupportingMediaChange: (media: string[]) => void;
  readonly onPreviewImageChange: (url: string) => void;
  readonly onArtworkCommentaryChange: (commentary: string) => void;
  readonly onAboutArtistChange: (aboutArtist: string) => void;
  readonly onBack: () => void;
  readonly onSubmit: () => void;
  readonly isSubmitting: boolean;
}

const AdditionalInfoStep: FC<AdditionalInfoStepProps> = ({
  airdropEntries,
  onAirdropEntriesChange,
  paymentInfo,
  onPaymentInfoChange,
  allowlistBatches,
  supportingMedia,
  artworkCommentary,
  aboutArtist,
  previewImage,
  requiresPreviewImage,
  previewRequiredMediaType,
  onBatchesChange,
  onSupportingMediaChange,
  onPreviewImageChange,
  onArtworkCommentaryChange,
  onAboutArtistChange,
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
      (e) =>
        !Number.isFinite(e.count) || e.count < 0 || !Number.isInteger(e.count)
    );
    if (hasInvalidCount) return false;

    const totalAllocated = airdropEntries.reduce(
      (sum, e) => sum + (e.count ?? 0),
      0
    );
    if (totalAllocated !== AIRDROP_TOTAL) return false;

    // Every entry with count > 0 must have a valid address
    const hasEntryWithCountButNoValidAddress = airdropEntries.some(
      (e) => e.count > 0 && (!e.address || !validateStrictAddress(e.address))
    );
    if (hasEntryWithCountButNoValidAddress) return false;

    // Every entry with a valid address must have count > 0
    const hasEntryWithAddressButNoCount = airdropEntries.some(
      (e) =>
        e.address &&
        validateStrictAddress(e.address) &&
        (!e.count || e.count <= 0)
    );
    if (hasEntryWithAddressButNoCount) return false;

    // All provided addresses must be valid (even if count is 0)
    const hasInvalidAddress = airdropEntries.some(
      (e) => e.address && !validateStrictAddress(e.address)
    );
    if (hasInvalidAddress) return false;

    // Payment address is required
    if (
      !paymentInfo.payment_address ||
      !validateStrictAddress(paymentInfo.payment_address)
    ) {
      return false;
    }

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

    // Commentary is required
    if (!artworkCommentary.trim()) return false;

    // About Artist is required
    if (!aboutArtist.trim()) return false;

    // If video/HTML submission, require a preview image
    if (requiresPreviewImage && !previewImage) return false;

    return true;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tw-mx-auto tw-flex tw-h-full tw-max-w-4xl tw-flex-col tw-pb-8"
    >
      <div className="tw-flex-1 tw-space-y-12 tw-overflow-y-auto tw-px-4 tw-py-2 tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-700">
        <p className="tw-text-sm tw-text-iron-400">
          Complete the following details for distribution and storytelling
          purposes.
        </p>

        <AirdropConfig
          entries={airdropEntries}
          onEntriesChange={onAirdropEntriesChange}
        />

        <PaymentConfig
          paymentInfo={paymentInfo}
          onPaymentInfoChange={onPaymentInfoChange}
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
          supportingMedia={supportingMedia}
          artworkCommentary={artworkCommentary}
          aboutArtist={aboutArtist}
          previewImage={previewImage}
          requiresPreviewImage={requiresPreviewImage}
          previewRequiredMediaType={previewRequiredMediaType}
          onSupportingMediaChange={onSupportingMediaChange}
          onPreviewImageChange={onPreviewImageChange}
          onArtworkCommentaryChange={onArtworkCommentaryChange}
          onAboutArtistChange={onAboutArtistChange}
        />
      </div>

      <div className="tw-mt-auto tw-flex tw-items-center tw-justify-between tw-border-t tw-border-iron-800 tw-px-4 tw-pt-6">
        <SecondaryButton onClicked={onBack} disabled={isSubmitting}>
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
