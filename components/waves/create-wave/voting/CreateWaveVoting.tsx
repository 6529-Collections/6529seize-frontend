"use client";

import { useState } from "react";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import CommonBorderedRadioButton from "@/components/utils/radio/CommonBorderedRadioButton";
import CreateWaveVotingRep from "./CreateWaveVotingRep";
import MaxVotesPerIdentityInput from "./MaxVotesPerIdentityInput";
import NegativeVotingToggle from "./NegativeVotingToggle";
import TimeWeightedVoting from "./TimeWeightedVoting";
import type { TimeWeightedVotingConfig } from "./types";

const VOTING_TYPES_ORDER: Record<ApiWaveCreditType, number | undefined> = {
  [ApiWaveCreditType.TdhPlusXtdh]: 0,
  [ApiWaveCreditType.Tdh]: 1,
  [ApiWaveCreditType.Rep]: 2,
  [ApiWaveCreditType.Xtdh]: undefined,
  [ApiWaveCreditType.CardSetTdh]: undefined,
};

const TIME_WEIGHTED_DURATION_ERROR =
  "Time-weighted voting interval must not exceed the wave duration.";

export default function CreateWaveVoting({
  waveType,
  selectedType,
  category,
  profileId,
  maxVotesPerIdentityPerDrop,
  errors,
  onTypeChange,
  setCategory,
  setProfileId,
  setMaxVotesPerIdentityPerDrop,
  timeWeighted,
  onTimeWeightedChange,
}: {
  readonly waveType: ApiWaveType;
  readonly selectedType: ApiWaveCreditType | null;
  readonly category: string | null;
  readonly profileId: string | null;
  readonly maxVotesPerIdentityPerDrop: number | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onTypeChange: (type: ApiWaveCreditType) => void;
  readonly setCategory: (category: string | null) => void;
  readonly setProfileId: (profileId: string | null) => void;
  readonly setMaxVotesPerIdentityPerDrop: (value: number | null) => void;
  readonly timeWeighted: TimeWeightedVotingConfig;
  readonly onTimeWeightedChange: (config: TimeWeightedVotingConfig) => void;
}) {
  // We now use the props from the parent instead of local state

  // Still using local state for negative voting toggle for now
  const [allowNegativeVotes, setAllowNegativeVotes] = useState(true);

  const TITLES: Record<ApiWaveType, string> = {
    [ApiWaveType.Chat]: "How Drops are Rated",
    [ApiWaveType.Rank]: "How Drops are Voted",
    [ApiWaveType.Approve]: "How Drops are Voted",
  };

  if (selectedType === null) {
    return null;
  }

  const timeWeightedErrorMessage = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.TIME_WEIGHTED_VOTING_INTERVAL_EXCEEDS_WAVE_DURATION
  )
    ? TIME_WEIGHTED_DURATION_ERROR
    : undefined;

  return (
    <div>
      <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 sm:tw-text-xl">
        {TITLES[waveType]}
      </p>
      <div className="tw-mt-3 tw-grid tw-gap-x-4 tw-gap-y-4 lg:tw-grid-cols-3">
        {(Object.keys(VOTING_TYPES_ORDER) as ApiWaveCreditType[])
          .filter((votingType) => VOTING_TYPES_ORDER[votingType] !== undefined)
          .map((votingType) => (
            <CommonBorderedRadioButton
              key={votingType}
              type={votingType}
              selected={selectedType}
              disabled={false}
              variant="subtle"
              onChange={onTypeChange}
            >
              <span
                className={`tw-flex tw-min-h-4 tw-items-center tw-text-sm tw-font-semibold ${
                  selectedType === votingType
                    ? "tw-text-white"
                    : "tw-text-iron-300 group-hover:tw-text-white"
                }`}
              >
                {`By ${WAVE_VOTING_LABELS[votingType]}`}
              </span>
            </CommonBorderedRadioButton>
          ))}
        {selectedType === ApiWaveCreditType.Rep && (
          <div className="tw-col-span-full">
            <CreateWaveVotingRep
              category={category}
              profileId={profileId}
              errors={errors}
              setCategory={setCategory}
              setProfileId={setProfileId}
            />
          </div>
        )}
      </div>

      {waveType !== ApiWaveType.Chat && (
        <MaxVotesPerIdentityInput
          value={maxVotesPerIdentityPerDrop}
          errors={errors}
          onChange={setMaxVotesPerIdentityPerDrop}
        />
      )}

      {/* Negative Voting Toggle - show for Rank and Approve waves */}
      {waveType !== ApiWaveType.Chat && (
        <NegativeVotingToggle
          allowNegativeVotes={allowNegativeVotes}
          onChange={setAllowNegativeVotes}
        />
      )}

      {/* Show Time-Weighted Voting for Rank and Approve waves */}
      {waveType !== ApiWaveType.Chat && (
        <TimeWeightedVoting
          config={timeWeighted}
          errorMessage={timeWeightedErrorMessage}
          onChange={onTimeWeightedChange}
        />
      )}
    </div>
  );
}
