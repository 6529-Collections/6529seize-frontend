"use client";

import React, { useRef, useCallback } from "react";
import FormSection from "../ui/FormSection";
import ValidationError from "../ui/ValidationError";

interface AirdropAddressFieldsProps {
  readonly airdropArtistAddress: string;
  readonly airdropArtistCount: number;
  readonly airdropChoiceAddress: string;
  readonly airdropChoiceCount: number;
  readonly onArtistAddressChange: (address: string) => void;
  readonly onArtistCountChange: (count: number) => void;
  readonly onChoiceAddressChange: (address: string) => void;
  readonly onChoiceCountChange: (count: number) => void;
  readonly artistAddressError?: string | null;
  readonly artistCountError?: string | null;
  readonly choiceAddressError?: string | null;
  readonly choiceCountError?: string | null;
}

const AirdropAddressFields: React.FC<AirdropAddressFieldsProps> = ({
  airdropArtistAddress,
  airdropArtistCount,
  airdropChoiceAddress,
  airdropChoiceCount,
  onArtistAddressChange,
  onArtistCountChange,
  onChoiceAddressChange,
  onChoiceCountChange,
  artistAddressError,
  artistCountError,
  choiceAddressError,
  choiceCountError,
}) => {
  const artistAddressRef = useRef<HTMLInputElement>(null);
  const artistCountRef = useRef<HTMLInputElement>(null);
  const choiceAddressRef = useRef<HTMLInputElement>(null);
  const choiceCountRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (artistAddressRef.current && artistAddressRef.current.value !== airdropArtistAddress) {
      artistAddressRef.current.value = airdropArtistAddress || "";
    }
  }, [airdropArtistAddress]);

  React.useEffect(() => {
    if (artistCountRef.current && artistCountRef.current.value !== airdropArtistCount.toString()) {
      artistCountRef.current.value = airdropArtistCount.toString();
    }
  }, [airdropArtistCount]);

  React.useEffect(() => {
    if (choiceAddressRef.current && choiceAddressRef.current.value !== airdropChoiceAddress) {
      choiceAddressRef.current.value = airdropChoiceAddress || "";
    }
  }, [airdropChoiceAddress]);

  React.useEffect(() => {
    if (choiceCountRef.current && choiceCountRef.current.value !== airdropChoiceCount.toString()) {
      choiceCountRef.current.value = airdropChoiceCount.toString();
    }
  }, [airdropChoiceCount]);

  const handleArtistAddressBlur = useCallback(() => {
    if (artistAddressRef.current && artistAddressRef.current.value !== airdropArtistAddress) {
      onArtistAddressChange(artistAddressRef.current.value);
    }
  }, [onArtistAddressChange, airdropArtistAddress]);

  const handleArtistCountBlur = useCallback(() => {
    if (artistCountRef.current) {
      const val = parseInt(artistCountRef.current.value, 10);
      if (!isNaN(val) && val !== airdropArtistCount) {
        onArtistCountChange(val);
      }
    }
  }, [onArtistCountChange, airdropArtistCount]);

  const handleChoiceAddressBlur = useCallback(() => {
    if (choiceAddressRef.current && choiceAddressRef.current.value !== airdropChoiceAddress) {
      onChoiceAddressChange(choiceAddressRef.current.value);
    }
  }, [onChoiceAddressChange, airdropChoiceAddress]);

  const handleChoiceCountBlur = useCallback(() => {
    if (choiceCountRef.current) {
      const val = parseInt(choiceCountRef.current.value, 10);
      if (!isNaN(val) && val !== airdropChoiceCount) {
        onChoiceCountChange(val);
      }
    }
  }, [onChoiceCountChange, airdropChoiceCount]);

  return (
    <FormSection title="Airdrop Information">
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
        {/* Artist Address */}
        <div className="tw-group tw-relative">
          <div className="tw-relative">
            <label
              htmlFor="airdrop-artist-address"
              className={`tw-absolute tw-left-3 -tw-top-2 tw-px-1 tw-text-xs tw-font-medium tw-bg-iron-900 tw-z-10 tw-transition-all ${
                artistAddressError ? "tw-text-red" : "tw-text-iron-300"
              }`}
            >
              Artist Address
            </label>
            <div className="tw-relative tw-rounded-xl tw-bg-iron-950">
              <input
                ref={artistAddressRef}
                id="airdrop-artist-address"
                type="text"
                placeholder="0x..."
                defaultValue={airdropArtistAddress}
                onBlur={handleArtistAddressBlur}
                className={`tw-form-input tw-w-full tw-rounded-lg tw-px-4 tw-py-3.5 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 ${
                  artistAddressError ? "tw-ring-red" : "tw-ring-iron-700"
                }`}
              />
            </div>
          </div>
          <ValidationError error={artistAddressError} />
        </div>

        {/* Artist Count */}
        <div className="tw-group tw-relative">
          <div className="tw-relative">
            <label
              htmlFor="airdrop-artist-count"
              className={`tw-absolute tw-left-3 -tw-top-2 tw-px-1 tw-text-xs tw-font-medium tw-bg-iron-900 tw-z-10 tw-transition-all ${
                artistCountError ? "tw-text-red" : "tw-text-iron-300"
              }`}
            >
              Artist Count
            </label>
            <div className="tw-relative tw-rounded-xl tw-bg-iron-950">
              <input
                ref={artistCountRef}
                id="airdrop-artist-count"
                type="number"
                min="0"
                defaultValue={airdropArtistCount}
                onBlur={handleArtistCountBlur}
                className={`tw-form-input tw-w-full tw-rounded-lg tw-px-4 tw-py-3.5 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 ${
                  artistCountError ? "tw-ring-red" : "tw-ring-iron-700"
                }`}
              />
            </div>
          </div>
          <ValidationError error={artistCountError} />
        </div>

        {/* Choice Address */}
        <div className="tw-group tw-relative">
          <div className="tw-relative">
            <label
              htmlFor="airdrop-choice-address"
              className={`tw-absolute tw-left-3 -tw-top-2 tw-px-1 tw-text-xs tw-font-medium tw-bg-iron-900 tw-z-10 tw-transition-all ${
                choiceAddressError ? "tw-text-red" : "tw-text-iron-300"
              }`}
            >
              Choice Address
            </label>
            <div className="tw-relative tw-rounded-xl tw-bg-iron-950">
              <input
                ref={choiceAddressRef}
                id="airdrop-choice-address"
                type="text"
                placeholder="0x..."
                defaultValue={airdropChoiceAddress}
                onBlur={handleChoiceAddressBlur}
                className={`tw-form-input tw-w-full tw-rounded-lg tw-px-4 tw-py-3.5 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 ${
                  choiceAddressError ? "tw-ring-red" : "tw-ring-iron-700"
                }`}
              />
            </div>
          </div>
          <ValidationError error={choiceAddressError} />
        </div>

        {/* Choice Count */}
        <div className="tw-group tw-relative">
          <div className="tw-relative">
            <label
              htmlFor="airdrop-choice-count"
              className={`tw-absolute tw-left-3 -tw-top-2 tw-px-1 tw-text-xs tw-font-medium tw-bg-iron-900 tw-z-10 tw-transition-all ${
                choiceCountError ? "tw-text-red" : "tw-text-iron-300"
              }`}
            >
              Choice Count
            </label>
            <div className="tw-relative tw-rounded-xl tw-bg-iron-950">
              <input
                ref={choiceCountRef}
                id="airdrop-choice-count"
                type="number"
                min="0"
                defaultValue={airdropChoiceCount}
                onBlur={handleChoiceCountBlur}
                className={`tw-form-input tw-w-full tw-rounded-lg tw-px-4 tw-py-3.5 tw-text-sm tw-text-iron-100 tw-bg-iron-900 tw-border-0 tw-outline-none tw-ring-1 ${
                  choiceCountError ? "tw-ring-red" : "tw-ring-iron-700"
                }`}
              />
            </div>
          </div>
          <ValidationError error={choiceCountError} />
        </div>
      </div>
    </FormSection>
  );
};

export default React.memo(AirdropAddressFields);
