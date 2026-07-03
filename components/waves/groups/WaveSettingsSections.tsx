"use client";

import type { ReactNode } from "react";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiWave } from "@/generated/models/ApiWave";
import WaveApprovalThresholds from "@/components/waves/specs/WaveApprovalThresholds";
import WaveApproveTabLabels from "@/components/waves/specs/WaveApproveTabLabels";
import WaveBindingRules from "@/components/waves/specs/WaveBindingRules";
import WaveCustomRules from "@/components/waves/specs/WaveCustomRules";
import WaveDisableLinks from "@/components/waves/specs/WaveDisableLinks";
import WaveGroup from "@/components/waves/specs/groups/group/WaveGroup";
import { WaveGroupType } from "@/components/waves/specs/groups/group/WaveGroup.types";
import WaveOutcomesVisibility from "@/components/waves/specs/WaveOutcomesVisibility";
import WaveSlowMode from "@/components/waves/specs/WaveSlowMode";
import WaveActiveCurationSection from "./curation/WaveActiveCurationSection";

interface WaveSettingsSectionsProps {
  readonly wave: ApiWave;
}

const SettingsSection = ({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) => (
  <section>
    <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-6 tw-px-4 tw-pt-6">
      <p className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-300">
        {title}
      </p>
    </div>
    <div className="tw-mt-2 tw-flex tw-flex-col tw-gap-y-0.5 tw-px-2">
      {children}
    </div>
  </section>
);

export default function WaveSettingsSections({
  wave,
}: WaveSettingsSectionsProps) {
  const isApproveWave = wave.wave.type === ApiWaveType.Approve;
  const isDisplaySettingsWave =
    wave.wave.type === ApiWaveType.Rank ||
    wave.wave.type === ApiWaveType.Approve;
  const supportsAcceptanceRules = wave.wave.type !== ApiWaveType.Chat;
  const showChatSettings = wave.chat.enabled;

  return (
    <div className="tw-pb-4">
      <WaveActiveCurationSection wave={wave} />

      <SettingsSection title="Rules">
        <WaveCustomRules wave={wave} />
        {supportsAcceptanceRules && <WaveBindingRules wave={wave} />}
      </SettingsSection>

      {isDisplaySettingsWave && (
        <SettingsSection title="Display">
          <WaveOutcomesVisibility wave={wave} />
        </SettingsSection>
      )}

      {isApproveWave && (
        <>
          <SettingsSection title="Approval tabs">
            <WaveApproveTabLabels wave={wave} />
          </SettingsSection>

          <SettingsSection title="Approval rule">
            <WaveApprovalThresholds wave={wave} />
          </SettingsSection>
        </>
      )}

      {showChatSettings && (
        <SettingsSection title="Chat">
          <WaveSlowMode wave={wave} />
          <WaveDisableLinks wave={wave} />
        </SettingsSection>
      )}

      <SettingsSection title="Access">
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
      </SettingsSection>
    </div>
  );
}
