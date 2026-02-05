import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";

type NextMintDropState = {
  readonly nextMint: ApiDrop | null;
  readonly nextMintTitle: string | null;
  readonly waveId: string | null;
  readonly isReady: boolean;
  readonly isSettingsLoaded: boolean;
  readonly isFetching: boolean;
};

export const useNextMintDrop = (): NextMintDropState => {
  const { seizeSettings, isLoaded } = useSeizeSettings();
  const waveId = seizeSettings.memes_wave_id;

  const { decisionPoints, isFetching } = useWaveDecisions({
    waveId: waveId ?? "",
    enabled: !!waveId,
  });

  const latestDecision = decisionPoints[decisionPoints.length - 1];
  const nextMint = latestDecision?.winners[0]?.drop ?? null;

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
