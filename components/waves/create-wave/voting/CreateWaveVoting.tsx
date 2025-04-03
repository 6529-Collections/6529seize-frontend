import { useState } from "react";
import { ApiWaveCreditType } from "../../../../generated/models/ApiWaveCreditType";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.validation";
import { WAVE_VOTING_LABELS } from "../../../../helpers/waves/waves.constants";
import CommonBorderedRadioButton from "../../../utils/radio/CommonBorderedRadioButton";
import CreateWaveVotingRep from "./CreateWaveVotingRep";
import NegativeVotingToggle from "./NegativeVotingToggle";
import TimeWeightedVoting from "./TimeWeightedVoting";
import { TimeWeightedVotingConfig } from "./types";

export default function CreateWaveVoting({
  waveType,
  selectedType,
  category,
  profileId,
  errors,
  onTypeChange,
  setCategory,
  setProfileId,
  timeWeighted,
  onTimeWeightedChange,
}: {
  readonly waveType: ApiWaveType;
  readonly selectedType: ApiWaveCreditType | null;
  readonly category: string | null;
  readonly profileId: string | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onTypeChange: (type: ApiWaveCreditType) => void;
  readonly setCategory: (category: string | null) => void;
  readonly setProfileId: (profileId: string | null) => void;
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

  if (!selectedType) {
    return null;
  }

  return (
    <div>
      <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-50">
        {TITLES[waveType]}
      </p>
      <div className="tw-mt-3 tw-grid lg:tw-grid-cols-3 tw-gap-x-4 tw-gap-y-4">
        {Object.values(ApiWaveCreditType).map((votingType) => (
          <CommonBorderedRadioButton
            key={votingType}
            type={votingType}
            selected={selectedType}
            disabled={false}
            label={WAVE_VOTING_LABELS[votingType]}
            onChange={onTypeChange}
          />
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

      {/* Negative Voting Toggle - show for Rank and Approve waves */}
      {waveType !== ApiWaveType.Chat && (
        <NegativeVotingToggle
          allowNegativeVotes={allowNegativeVotes}
          onChange={setAllowNegativeVotes}
        />
      )}

      {/* Only show Time-Weighted Voting for Rank waves */}
      {waveType === ApiWaveType.Rank && (
        <TimeWeightedVoting
          config={timeWeighted}
          onChange={onTimeWeightedChange}
        />
      )}
    </div>
  );
}
