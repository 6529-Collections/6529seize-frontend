import { WaveCreditType } from "../../../../generated/models/WaveCreditType";
import { WaveType } from "../../../../generated/models/WaveType";
import { WAVE_VOTING_LABELS } from "../../../../helpers/waves/waves.constants";
import CommonBorderedRadioButton from "../../../utils/radio/CommonBorderedRadioButton";
import CreateWaveNextStep, {
  CreateWaveNextStepType,
} from "../utils/CreateWaveNextStep";
import CreateWaveVotingRep from "./CreateWaveVotingRep";

export default function CreateWaveVoting({
  waveType,
  selectedType,
  category,
  profileId,
  onTypeChange,
  setCategory,
  setProfileId,
  onNextStep,
}: {
  readonly waveType: WaveType;
  readonly selectedType: WaveCreditType;
  readonly category: string | null;
  readonly profileId: string | null;
  readonly onTypeChange: (type: WaveCreditType) => void;
  readonly setCategory: (category: string | null) => void;
  readonly setProfileId: (profileId: string | null) => void;
  readonly onNextStep: () => void;
}) {
  const nextStepType =
    waveType === WaveType.Approve
      ? CreateWaveNextStepType.NEXT
      : CreateWaveNextStepType.SAVE;
  return (
    <div className="tw-flex tw-flex-col">
      <div className="tw-max-w-xl tw-mx-auto tw-w-full">
        <p className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
          How Drops are Rated
        </p>
        <div className="tw-mt-4 tw-grid lg:tw-grid-cols-3 tw-gap-x-4 tw-gap-y-4">
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
                setCategory={setCategory}
                setProfileId={setProfileId}
              />
            </div>
          )}
        </div>
        <div className="tw-mt-8 tw-text-right">
          <CreateWaveNextStep
            disabled={false}
            onClick={onNextStep}
            stepType={nextStepType}
          />
        </div>
      </div>
    </div>
  );
}
