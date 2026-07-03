"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { buildWaveRules } from "@/helpers/waves/wave-rules.helpers";
import { useWaveMetadata } from "@/hooks/waves/useWaveMetadata";
import { useMemo } from "react";
import WaveRulesPanel from "./WaveRulesPanel";

interface WaveRulesProps {
  readonly wave: ApiWave;
  readonly useRing?: boolean | undefined;
}

export default function WaveRules({ wave, useRing = true }: WaveRulesProps) {
  const metadataQuery = useWaveMetadata(wave.id, {
    enabled: true,
  });
  const rules = useMemo(
    () =>
      buildWaveRules({
        wave,
        metadata: metadataQuery.data ?? null,
      }),
    [metadataQuery.data, wave]
  );

  return <WaveRulesPanel rules={rules} useRing={useRing} />;
}
