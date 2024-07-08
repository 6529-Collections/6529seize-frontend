import { Wave } from "../../../../generated/models/Wave";
import WaveAuthor from "./WaveAuthor";
import WaveCreated from "./WaveCreated";
import WaveEnding from "./WaveEnding";
import WaveGroup from "./groups/WaveGroup";
import WaveTypeIcon from "./WaveTypeIcon";

export default function WaveSpecs({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tw-w-full">
      <div className="tw-group">
        <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
          <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
            <div className="tw-px-6 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
              <p className="tw-mb-0 tw-text-lg tw-text-iron-50 tw-font-semibold">
                General
              </p>
            </div>
            <div className="tw-px-6 tw-py-6 tw-flex tw-flex-col tw-gap-y-6">
              {/*   <div className="tw-flex tw-flex-col tw-gap-y-2">
                <WaveCreated wave={wave} />
                <WaveEnding wave={wave} />
              </div> */}
              <WaveTypeIcon waveType={wave.wave.type} />
              <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
                <span className="tw-font-medium tw-text-iron-400">Voting</span>
                <div className="tw-flex tw-flex-col tw-gap-y-1.5">
                  <span className="tw-font-medium tw-text-iron-50 tw-text-md">
                    By Rep
                  </span>
                  <div className="tw-bg-iron-800 tw-rounded-xl tw-flex tw-flex-col tw-gap-y-1 tw-px-4 tw-py-2">
                    <span className="tw-font-medium tw-text-sm tw-text-iron-300">
                      test rep no problem
                    </span>
                    <div className="tw-flex tw-items-center tw-gap-x-2">
                      <img
                        className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-rounded-md tw-bg-iron-800"
                        src="#"
                        alt="Profile Picture"
                      />
                      <span className="tw-font-medium tw-text-sm tw-text-iron-50">
                        Handle
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <WaveAuthor wave={wave} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
