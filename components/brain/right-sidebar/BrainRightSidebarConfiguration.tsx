import type { ApiWave } from "@/generated/models/ApiWave";
import WaveConfigurationSections from "@/components/waves/groups/WaveConfigurationSections";

interface BrainRightSidebarConfigurationProps {
  readonly wave: ApiWave;
}

export default function BrainRightSidebarConfiguration({
  wave,
}: BrainRightSidebarConfigurationProps) {
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-bg-iron-950">
      <WaveConfigurationSections wave={wave} />
    </div>
  );
}
