import type { ApiWave } from "@/generated/models/ApiWave";
import WaveSettingsSections from "@/components/waves/groups/WaveSettingsSections";

interface BrainRightSidebarSettingsProps {
  readonly wave: ApiWave;
}

export default function BrainRightSidebarSettings({
  wave,
}: BrainRightSidebarSettingsProps) {
  return (
    <div className="tw-flex tw-flex-col tw-overflow-y-auto tw-bg-iron-950">
      <WaveSettingsSections wave={wave} />
    </div>
  );
}
