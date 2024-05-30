import { WaveVotingConfig } from "../../../../generated/models/WaveVotingConfig";
import { WAVE_VOTING_LABELS } from "../../../../helpers/waves/waves.constants";
import { WaveVotingType } from "../../../../types/waves.types";
import CommonBorderedRadioButton from "../../../utils/radio/CommonBorderedRadioButton";
import CreateWaveVotingRep from "./CreateWaveVotingRep";

export default function CreateWaveVoting({
  selectedType,
  category,
  profileId,
  onTypeChange,
  setCategory,
  setProfileId,
}: {
  readonly selectedType: WaveVotingType;
  readonly category: string | null;
  readonly profileId: string | null;
  readonly onTypeChange: (type: WaveVotingType) => void;
  readonly setCategory: (category: string | null) => void;
  readonly setProfileId: (profileId: string | null) => void;
}) {
  return (
    <div className="tw-flex tw-flex-col">
      <div className="tw-max-w-xl tw-mx-auto tw-w-full">
        <div>
          <p className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-iron-50">
            How Drops are Rated
          </p>
          <div className="tw-mt-5 tw-grid lg:tw-grid-cols-3 tw-gap-x-4 tw-gap-y-4">
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
          <div className="tw-mt-6 tw-text-right">
            <button
              type="button"
              className="tw-w-full sm:tw-w-auto tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-base tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              <span>Next step</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
