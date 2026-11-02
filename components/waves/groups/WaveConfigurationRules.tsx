import WaveCustomRules from "@/components/waves/specs/WaveCustomRules";
import type { ApiWave } from "@/generated/models/ApiWave";

interface WaveConfigurationRulesProps {
  readonly wave: ApiWave;
}

export default function WaveConfigurationRules({
  wave,
}: WaveConfigurationRulesProps) {
  return <WaveCustomRules wave={wave} display="configuration" />;
}
