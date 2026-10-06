"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { useCompetitionNavigation } from "@/contexts/CompetitionNavigationContext";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  getCompetitionIdFromPathname,
  isCompetitionPathname,
} from "@/helpers/competition.helpers";
import { getWaveOutcomeVisibilityFromMetadata } from "@/helpers/waves/wave-metadata.helpers";
import { useWaveCompetitionsTab } from "@/hooks/competitions/useWaveCompetitionsTab";
import { useWave } from "@/hooks/useWave";
import { useWavePollSummary } from "@/hooks/useWaveHasPolls";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import {
  useWaveMetadata,
  useWaveOutcomeVisibility,
} from "@/hooks/waves/useWaveMetadata";
import { MyStreamWaveTab } from "@/types/waves.types";
import { useContentTab, WaveVotingState } from "../ContentTabContext";

const getVotingState = (
  isUpcoming: boolean,
  isCompleted: boolean
): WaveVotingState => {
  if (isUpcoming) return WaveVotingState.NOT_STARTED;
  if (isCompleted) return WaveVotingState.ENDED;
  return WaveVotingState.ONGOING;
};

// Register from the content mounted on every surface; the app has its own tab row.
export function useWaveContentTabRegistration(
  wave: ApiWave | undefined,
  competitionOnly: boolean
) {
  const { updateAvailableTabs } = useContentTab();
  const pathname = usePathname();
  const search = useSearchParams();
  const { connectedProfile, fetchingProfile } = useAuth();
  const hasAuthenticatedProfile = Boolean(connectedProfile?.handle);
  const { flat, nativeCompetition } = useCompetitionNavigation();
  const nativeDefault = flat ? nativeCompetition : null;
  const { isChatWave, isMemesWave, isCurationWave, isRankWave, isApproveWave } =
    useWave(wave);
  const {
    hasCompetitions,
    isPending: competitionsPending,
    hideCompetitionsTab,
    defaultCompetitionId,
    defaultSelectionEnabled,
  } = useWaveCompetitionsTab(wave);
  const selectedId =
    getCompetitionIdFromPathname(pathname) ??
    search.get("competition") ??
    defaultCompetitionId;
  const { hasPolls, isPending: pollsPending } = useWavePollSummary({
    waveId: wave?.id,
    enabled: Boolean(wave),
  });
  const {
    voting: { isUpcoming, isCompleted },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);
  const votingState = getVotingState(isUpcoming, isCompleted);
  const waveOutcomesVisible = useWaveOutcomeVisibility(wave);
  const nativePresentation = useMemo(
    () =>
      (nativeDefault?.presentation ?? []).map((item, id) => ({ ...item, id })),
    [nativeDefault?.presentation]
  );
  const outcomesVisible = nativeDefault
    ? getWaveOutcomeVisibilityFromMetadata(nativePresentation)
    : waveOutcomesVisible;
  const { isPending: metadataPending } = useWaveMetadata(wave?.id, {
    enabled: isRankWave || isApproveWave,
  });
  const tabsReady =
    !fetchingProfile &&
    !competitionsPending &&
    !pollsPending &&
    !((isRankWave || isApproveWave) && metadataPending);
  const hasSerialTarget = search.get("serialNo") !== null;

  useEffect(() => {
    if (!wave) return;
    updateAvailableTabs({
      waveId: wave.id,
      tabsReady,
      isMemesWave: nativeDefault ? false : isMemesWave,
      isChatWave: nativeDefault ? true : isChatWave,
      hasPolls,
      hasCompetitions,
      hideCompetitionsTab,
      hasCompetitionConfiguration:
        (!isCompetitionPathname(pathname) || flat || competitionOnly) &&
        (isRankWave || isApproveWave || Boolean(selectedId)),
      defaultCompetitionId: selectedId,
      defaultSelectionEnabled,
      hasAuthenticatedProfile,
      isCurationWave,
      isApproveWave,
      showOutcomeTab: outcomesVisible,
      votingState,
      hasFirstDecisionPassed: firstDecisionDone,
      transientPreferredTab: hasSerialTarget ? MyStreamWaveTab.CHAT : null,
    });
  }, [
    wave,
    tabsReady,
    nativeDefault,
    isMemesWave,
    isChatWave,
    hasPolls,
    hasCompetitions,
    hideCompetitionsTab,
    pathname,
    flat,
    competitionOnly,
    isRankWave,
    isApproveWave,
    selectedId,
    defaultSelectionEnabled,
    hasAuthenticatedProfile,
    isCurationWave,
    outcomesVisible,
    votingState,
    firstDecisionDone,
    hasSerialTarget,
    updateAvailableTabs,
  ]);
}
