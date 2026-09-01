import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import WaveTypeIcon from "@/components/waves/specs/WaveTypeIcon";
import WaveChatStatus from "@/components/waves/specs/WaveChatStatus";
import WaveDisableLinks from "@/components/waves/specs/WaveDisableLinks";
import WaveSlowMode from "@/components/waves/specs/WaveSlowMode";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";
import { Suspense } from "react";
import WaveAccessGroups from "./WaveAccessGroups";
import WaveConfigurationAdminSettings from "./WaveConfigurationAdminSettings";
import WaveConfigurationDeleteChatHistory from "./WaveConfigurationDeleteChatHistory";
import WaveConfigurationDisplay from "./WaveConfigurationDisplay";
import WaveConfigurationPersonalDisplay from "./WaveConfigurationPersonalDisplay";
import WaveConfigurationPersonalCuration from "./WaveConfigurationPersonalCuration";
import WaveConfigurationReadOnlySections from "./WaveConfigurationReadOnlySections";
import WaveConfigurationRules from "./WaveConfigurationRules";
import WavePanelSection from "./WavePanelSection";

interface WaveConfigurationSectionsProps {
  readonly wave: ApiWave;
}

export default function WaveConfigurationSections({
  wave,
}: WaveConfigurationSectionsProps) {
  const isPerpetualRank =
    wave.wave.type === ApiWaveType.Rank && !wave.wave.decisions_strategy;
  const showChatStatus = wave.wave.type !== ApiWaveType.Chat;
  const showChatSettings = wave.chat.enabled;
  const showChatSection = showChatStatus || showChatSettings;

  return (
    <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-pb-4">
      <WavePanelSection
        title={waveRightPanelText(
          "waves.sidebar.rightPanel.configuration.wave"
        )}
      >
        <div className="tw-grid tw-min-h-9 tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-center tw-gap-2 tw-px-2 tw-py-1.5 tw-text-sm">
          <span className="tw-min-w-0 tw-font-normal tw-leading-5 tw-text-iron-500">
            {waveRightPanelText("waves.sidebar.rightPanel.specs.type")}
          </span>
          <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-end tw-text-right">
            <WaveTypeIcon
              waveType={wave.wave.type}
              label={
                isPerpetualRank
                  ? waveRightPanelText(
                      "waves.sidebar.rightPanel.configuration.perpetualRankType"
                    )
                  : undefined
              }
            />
          </div>
        </div>
      </WavePanelSection>

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
      <Suspense fallback={null}>
        <WaveConfigurationPersonalCuration wave={wave} />
      </Suspense>
    </div>
  );
}
