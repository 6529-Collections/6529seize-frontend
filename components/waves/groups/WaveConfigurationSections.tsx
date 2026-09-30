import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import WaveChatStatus from "@/components/waves/specs/WaveChatStatus";
import WaveDisableLinks from "@/components/waves/specs/WaveDisableLinks";
import WaveSlowMode from "@/components/waves/specs/WaveSlowMode";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import WaveAccessGroups from "./WaveAccessGroups";
import WaveConfigurationAdminSettings from "./WaveConfigurationAdminSettings";
import WaveConfigurationDeleteChatHistory from "./WaveConfigurationDeleteChatHistory";
import WaveConfigurationDisplay from "./WaveConfigurationDisplay";
import WaveConfigurationPersonalDisplay from "./WaveConfigurationPersonalDisplay";
import WaveConfigurationReadOnlySections from "./WaveConfigurationReadOnlySections";
import WaveConfigurationRules from "./WaveConfigurationRules";
import WavePanelSection from "./WavePanelSection";

interface WaveConfigurationSectionsProps {
  readonly wave: ApiWave;
}

export default function WaveConfigurationSections({
  wave,
}: WaveConfigurationSectionsProps) {
  const showChatStatus = wave.wave.type !== ApiWaveType.Chat;
  const showChatSettings = wave.chat.enabled;
  const showChatSection = showChatStatus || showChatSettings;

  return (
    <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-pb-4">
      <WavePanelSection
        title={waveRightPanelText("waves.sidebar.rightPanel.settings.access")}
      >
        <WaveAccessGroups wave={wave} display="members" />
      </WavePanelSection>

      {showChatSection && (
        <WavePanelSection
          title={waveRightPanelText("waves.sidebar.rightPanel.settings.chat")}
        >
          <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/5">
            {showChatStatus && (
              <WaveChatStatus wave={wave} display="configuration" />
            )}
            {showChatSettings && (
              <>
                <WaveDisableLinks wave={wave} display="configuration" />
                <WaveSlowMode wave={wave} display="configuration" />
              </>
            )}
          </div>
        </WavePanelSection>
      )}

      <WaveConfigurationDisplay wave={wave} />
      <WaveConfigurationReadOnlySections wave={wave} />
      <WaveConfigurationRules wave={wave} />
      <WaveConfigurationAdminSettings wave={wave} />
      <WaveConfigurationDeleteChatHistory wave={wave} />
      {showChatSettings && <WaveConfigurationPersonalDisplay />}
    </div>
  );
}
