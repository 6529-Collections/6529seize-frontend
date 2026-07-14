import type { ApiWave } from "@/generated/models/ApiWave";
import WaveSettingsSections from "@/components/waves/groups/WaveSettingsSections";

interface BrainRightSidebarSettingsProps {
  readonly wave: ApiWave;
}

export default function BrainRightSidebarSettings({
  wave,
}: BrainRightSidebarSettingsProps) {
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-bg-iron-950">
      <WaveSettingsSections wave={wave} />
    </div>
  );
}
