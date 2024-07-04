import { WaveCreditType } from "../../../../generated/models/WaveCreditType";
import { WaveType } from "../../../../generated/models/WaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.helpers";
import { WAVE_VOTING_LABELS } from "../../../../helpers/waves/waves.constants";
import CommonBorderedRadioButton from "../../../utils/radio/CommonBorderedRadioButton";
import CreateWaveVotingRep from "./CreateWaveVotingRep";

export default function CreateWaveVoting({
  waveType,
  selectedType,
  category,
  profileId,
  errors,
  onTypeChange,
  setCategory,
  setProfileId,
}: {
  readonly waveType: WaveType;
  readonly selectedType: WaveCreditType;
  readonly category: string | null;
  readonly profileId: string | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onTypeChange: (type: WaveCreditType) => void;
  readonly setCategory: (category: string | null) => void;
  readonly setProfileId: (profileId: string | null) => void;
}) {
  const TITLES: Record<WaveType, string> = {
    [WaveType.Chat]: "How Drops are Rated",
    [WaveType.Rank]: "How Drops are Voted",
    [WaveType.Approve]: "How Drops are Voted",
  };

  return (
    <div>
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
        {TITLES[waveType]}
      </p>
      <div className="tw-mt-3 tw-grid lg:tw-grid-cols-3 tw-gap-x-4 tw-gap-y-4">
        {Object.values(WaveCreditType).map((votingType) => (
          <CommonBorderedRadioButton
            key={votingType}
            type={votingType}
            selected={selectedType}
            label={WAVE_VOTING_LABELS[votingType]}
            onChange={onTypeChange}
          />
        ))}
        {selectedType === WaveCreditType.Rep && (
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
    </div>
  );
}
