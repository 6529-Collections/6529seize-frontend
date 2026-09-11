import WaveBindingRules from "@/components/waves/specs/WaveBindingRules";
import WaveCustomRules from "@/components/waves/specs/WaveCustomRules";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

interface WaveConfigurationRulesProps {
  readonly wave: ApiWave;
}

export default function WaveConfigurationRules({
  wave,
}: WaveConfigurationRulesProps) {
  return (
    <>
      <WaveCustomRules wave={wave} display="configuration" />
      {wave.wave.type !== ApiWaveType.Chat && (
        <WaveBindingRules wave={wave} display="configuration" />
      )}
    </>
  );
}
