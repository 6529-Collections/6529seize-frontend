import { Wave } from "../../../../generated/models/Wave";
import { WAVE_LABELS } from "../../../../helpers/waves/waves.constants";
import WaveAuthor from "./WaveAuthor";
import WaveCreated from "./WaveCreated";
import WaveEnding from "./WaveEnding";
import WaveGroup from "./WaveGroup";

export default function WaveSpecs({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tw-w-full">
      <div className="tw-group">
        <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
          <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
            <div className="tw-px-6 tw-pt-6 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
              <p className="tw-mb-0 tw-text-xl tw-text-white tw-font-semibold">
                General
              </p>
            </div>
            <div className="tw-px-6 tw-py-6 tw-flex tw-flex-col tw-gap-y-6">
              <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                <span className="tw-font-medium tw-text-iron-400">Type</span>
                <span className="tw-font-medium tw-text-white tw-text-base">
                  {WAVE_LABELS[wave.wave.type]}
                </span>
              </div>
              <WaveAuthor wave={wave} />
              <WaveCreated wave={wave} />
              <WaveEnding wave={wave} />
              <WaveGroup scope={wave.visibility.scope} label="View" />
              <WaveGroup scope={wave.participation.scope} label="Drop" />
              <WaveGroup scope={wave.voting.scope} label="Vote" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
