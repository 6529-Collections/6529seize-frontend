import { Wave } from "../../../generated/models/Wave";
import DropsListItem from "../../drops/view/item/DropsListItem";
import WaveCreateDrop from "./drop/WaveCreateDrop";
import WaveHeader from "./header/WaveHeader";
import WaveSpecs from "./specs/WaveSpecs";

export default function WaveDetailed({ wave }: { readonly wave: Wave }) {
  return (
    <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen">
      <WaveHeader wave={wave} />
      <div className="tw-mt-12 tw-pb-16 lg:tw-pb-20 tw-max-w-5xl tw-mx-auto">
        <div className="tw-flex tw-justify-center tw-gap-x-8">
          <div className="tw-flex-1 tw-flex tw-flex-col tw-gap-y-6">
            <WaveSpecs wave={wave} />
            <div className="tw-w-full">
              <div className="tw-group">
                <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
                  <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
                    <div className="tw-px-6 tw-pt-6 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
                      <p className="tw-mb-0 tw-text-xl tw-text-white tw-font-semibold">
                        Outcome
                      </p>
                    </div>
                    <div className="tw-px-6 tw-py-6 tw-flex tw-flex-col tw-gap-y-6">
                      <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                        <span className="tw-font-medium tw-text-iron-400">
                          Threshold
                        </span>
                        <span className="tw-font-medium tw-text-white tw-text-base">
                          200
                        </span>
                      </div>
                      <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                        <span className="tw-font-medium tw-text-iron-400">
                          Time
                        </span>
                        <span className="tw-font-medium tw-text-white tw-text-base">
                          2 weeks
                        </span>
                      </div>
                      <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                        <span className="tw-font-medium tw-text-iron-400">
                          Winners
                        </span>
                        <span className="tw-font-medium tw-text-white tw-text-base">
                          2 weeks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="tw-w-[672px] tw-space-y-6">
            <WaveCreateDrop />
            <DropsListItem drop={wave.description_drop} />
          </div>
        </div>
      </div>
    </div>
  );
}
