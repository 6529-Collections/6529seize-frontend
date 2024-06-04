import { WaveVotingConfig } from "../../../../generated/models/WaveVotingConfig";
import { WAVE_VOTING_LABELS } from "../../../../helpers/waves/waves.constants";
import { WaveType, WaveVotingType } from "../../../../types/waves.types";
import CommonBorderedRadioButton from "../../../utils/radio/CommonBorderedRadioButton";
import CreateWaveNextStep from "../utils/CreateWaveNextStep";
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
  readonly selectedType: WaveVotingType;
  readonly category: string | null;
  readonly profileId: string | null;
  readonly onTypeChange: (type: WaveVotingType) => void;
  readonly setCategory: (category: string | null) => void;
  readonly setProfileId: (profileId: string | null) => void;
  readonly onNextStep: () => void;
}) {
  const nextStepLabel = waveType === WaveType.APPROVE ? "Next Step" : "Finish";
  return (
    <div className="tw-flex tw-flex-col">
      <div className="tw-max-w-xl tw-mx-auto tw-w-full">
        <p className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-iron-50">
          How Drops are Rated
        </p>
        <div className="tw-mt-4 tw-grid lg:tw-grid-cols-3 tw-gap-x-4 tw-gap-y-4">
          {Object.values(WaveVotingType).map((votingType) => (
            <CommonBorderedRadioButton
              key={votingType}
              type={votingType}
              selected={selectedType}
              label={WAVE_VOTING_LABELS[votingType]}
              onChange={onTypeChange}
            />
          ))}
          {selectedType === WaveVotingType.REP && (
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
            label={nextStepLabel}
          />
        </div>
      </div>
    </div>
  );
}
