import { ApiWaveCreditType } from "../../../../generated/models/ApiWaveCreditType";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../helpers/waves/create-wave.validation";
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
  readonly waveType: ApiWaveType;
  readonly selectedType: ApiWaveCreditType | null;
  readonly category: string | null;
  readonly profileId: string | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onTypeChange: (type: ApiWaveCreditType) => void;
  readonly setCategory: (category: string | null) => void;
  readonly setProfileId: (profileId: string | null) => void;
}) {
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
      <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50">
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
    </div>
  );
}
