"use client";

import WaveRulesPanel from "@/components/waves/specs/WaveRulesPanel";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { buildWaveRules } from "@/helpers/waves/wave-rules.helpers";
import { useWaveMetadata } from "@/hooks/waves/useWaveMetadata";
import { useMemo } from "react";
import WaveConfigurationApproval from "./WaveConfigurationApproval";

interface WaveConfigurationReadOnlySectionsProps {
  readonly wave: ApiWave;
}

const CONFIGURATION_SECTION_IDS = new Set([
  "timing",
  "submissions",
  "voting",
  "approval",
]);

export default function WaveConfigurationReadOnlySections({
  wave,
}: WaveConfigurationReadOnlySectionsProps) {
  const metadataQuery = useWaveMetadata(wave.id, {
    enabled: wave.wave.type !== ApiWaveType.Chat,
  });
  const rules = useMemo(() => {
    const waveRules = buildWaveRules({
      wave,
      metadata: metadataQuery.data ?? null,
    });

    return {
      ...waveRules,
      automatic: waveRules.automatic.filter((section) =>
        CONFIGURATION_SECTION_IDS.has(section.id)
      ),
    };
  }, [metadataQuery.data, wave]);

  const scheduleSection = rules.automatic.find(
    (section) => section.id === "timing"
  );
  const approvalSection =
    wave.wave.type === ApiWaveType.Approve
      ? rules.automatic.find((section) => section.id === "approval")
      : undefined;
  const remainingSections = rules.automatic.filter(
    (section) => section.id === "submissions" || section.id === "voting"
  );

  if (!scheduleSection && !approvalSection && remainingSections.length === 0) {
    return null;
  }

  return (
    <>
      {scheduleSection && (
        <WaveRulesPanel
          rules={{ ...rules, automatic: [scheduleSection] }}
          showCustomRules={false}
          showTitle={false}
          useRing={false}
        />
      )}
      {approvalSection && (
        <WaveConfigurationApproval wave={wave} section={approvalSection} />
      )}
      {remainingSections.length > 0 && (
        <WaveRulesPanel
          rules={{ ...rules, automatic: remainingSections }}
          showCustomRules={false}
          showTitle={false}
          useRing={false}
        />
      )}
    </>
  );
}
