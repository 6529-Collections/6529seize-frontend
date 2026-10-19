import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { useWaveById } from "@/hooks/useWaveById";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";
import { getRenderableWaveDecisionWinners } from "@/helpers/waves/wave-decision.helpers";
import { toApiWaveMin } from "@/helpers/waves/wave.helpers";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";

type NextMintDropState = {
  readonly nextMint: ApiDropV2View | null;
  readonly nextMintTitle: string | null;
  readonly waveId: string | null;
  readonly isReady: boolean;
  readonly isSettingsLoaded: boolean;
  readonly isFetching: boolean;
};

export const useNextMintDrop = (): NextMintDropState => {
  const { seizeSettings, isLoaded } = useSeizeSettings();
  const waveId = seizeSettings.memes_wave_id;
  const { wave } = useWaveById(waveId, {
    enabled: !!waveId,
  });

  const { decisionPoints, isFetching } = useWaveDecisions({
    waveId: waveId ?? "",
    enabled: !!waveId,
    pageSize: 1,
  });

  const latestDecision = decisionPoints[decisionPoints.length - 1];
  const rawNextMint = (getRenderableWaveDecisionWinners(
    latestDecision?.winners ?? []
  )[0]?.drop ?? null) as ApiDropV2View | null;
  const nextMint =
    rawNextMint && wave
      ? {
          ...rawNextMint,
          wave: toApiWaveMin(wave),
        }
      : rawNextMint;

  const nextMintTitle =
    nextMint?.title ??
    nextMint?.metadata.find((m) => m.data_key === "title")?.data_value ??
    null;

  return {
    nextMint,
    nextMintTitle,
    waveId,
    isReady: isLoaded && !!waveId,
    isSettingsLoaded: isLoaded,
    isFetching: isFetching || (!isLoaded && !!waveId),
  };
};
