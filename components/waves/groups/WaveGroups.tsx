import type { ApiWave } from "@/generated/models/ApiWave";
import WaveSettingsSections from "./WaveSettingsSections";

interface WaveGroupsProps {
  readonly wave: ApiWave;
  readonly useRing?: boolean | undefined;
}

export default function WaveGroups({ wave, useRing = true }: WaveGroupsProps) {
  const ringClasses = useRing
    ? "tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl"
    : "tw-rounded-b-xl lg:tw-rounded-b-none";

  return (
    <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800">
      <div className={`tw-relative tw-h-full tw-bg-iron-950 ${ringClasses}`}>
        <div className="no-scrollbar tw-h-full tw-overflow-y-auto tw-overflow-x-hidden">
          <WaveSettingsSections wave={wave} />
        </div>
      </div>
    </div>
  );
}
