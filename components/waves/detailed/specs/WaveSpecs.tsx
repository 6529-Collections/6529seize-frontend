import { Wave } from "../../../../generated/models/Wave";
import WaveAuthor from "./WaveAuthor";
import WaveCreated from "./WaveCreated";
import WaveEnding from "./WaveEnding";
import WaveGroup from "./WaveGroup";
import WaveTypeIcon from "./WaveTypeIcon";

export default function WaveSpecs({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tw-w-full">
      <div className="tw-group">
        <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
          <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
            <div className="tw-px-6 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
              <p className="tw-mb-0 tw-text-xl tw-text-white tw-font-semibold">
                General
              </p>
            </div>
            <div className="tw-px-6 tw-py-6 tw-flex tw-flex-col tw-gap-y-6">
              <WaveTypeIcon waveType={wave.wave.type} />
              <WaveAuthor wave={wave} />
              <WaveCreated wave={wave} />
              <WaveEnding wave={wave} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
