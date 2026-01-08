import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import WaveGroup from "../specs/groups/group/WaveGroup";
import { WaveGroupType } from "../specs/groups/group/WaveGroup.types";

interface WaveGroupsProps {
  readonly wave: ApiWave;
  readonly useRing?: boolean | undefined;
}

export default function WaveGroups({ wave, useRing = true }: WaveGroupsProps) {
  const ringClasses = useRing
    ? "tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl"
    : "tw-rounded-b-xl lg:tw-rounded-b-none";

  return (
    <div className="tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0">
      <div className={`tw-h-full tw-bg-iron-950 tw-relative ${ringClasses}`}>
        <div className="tw-h-full tw-overflow-y-auto tw-overflow-x-hidden no-scrollbar">
          <div className="tw-pb-4">
            <div className="tw-px-4 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
              <p className="tw-mb-0 tw-text-base tw-text-iron-200 tw-font-semibold tw-tracking-tight">
                Eligible
              </p>
            </div>
            <div className="tw-px-4 tw-flex tw-flex-col tw-gap-y-2 tw-mt-2">
              <WaveGroup
                scope={wave.visibility.scope}
                type={WaveGroupType.VIEW}
                wave={wave}
              />
              {wave.wave.type !== ApiWaveType.Chat && (
                <>
                  <WaveGroup
                    scope={wave.participation.scope}
                    type={WaveGroupType.DROP}
                    wave={wave}
                  />
                  <WaveGroup
                    scope={wave.voting.scope}
                    type={WaveGroupType.VOTE}
                    wave={wave}
                  />
                </>
              )}

              <WaveGroup
                scope={wave.chat.scope}
                type={WaveGroupType.CHAT}
                wave={wave}
              />

              <WaveGroup
                scope={wave.wave.admin_group}
                type={WaveGroupType.ADMIN}
                wave={wave}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
