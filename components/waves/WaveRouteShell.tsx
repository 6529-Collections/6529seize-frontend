"use client";

import { useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import MyStreamWave from "@/components/brain/my-stream/MyStreamWave";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import {
  getCompetitionIdFromPathname,
  isCompetitionPathname,
} from "@/helpers/competition.helpers";
import { registerWaveTabShell } from "@/helpers/waves/wave-tab-shell";
import { useContentTab } from "@/components/brain/ContentTabContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { MyStreamWaveTab } from "@/types/waves.types";

const CompetitionWaveContent = dynamic(
  () => import("@/components/competitions/CompetitionWaveContent")
);
const CompetitionDraftRoute = dynamic(
  () => import("@/components/competitions/CompetitionDraftRoute")
);
const CompetitionHub = dynamic(
  () => import("@/components/competitions/CompetitionHub")
);

/** Both page entry points render from the live URL, never stale server route props.
 * The same mounted wave owns the shared tab and competition tab lifecycles.
 */
export default function WaveRouteShell({
  waveId,
}: {
  readonly waveId: string;
}) {
  const pathname = usePathname();
  const viewer = useCompetitionViewer();
  const competitionId = getCompetitionIdFromPathname(pathname);
  const { activeContentTab } = useContentTab();
  const { registerWave } = useMyStream();
  const chatActive = activeContentTab === MyStreamWaveTab.CHAT;
  useEffect(() => registerWaveTabShell(waveId), [waveId]);
  // The wave already registers on mount (including on Leaderboard). Reuse that
  // store/request when Chat opens, refreshing only newer messages in background.
  useEffect(() => {
    if (chatActive) registerWave(waveId, true);
  }, [chatActive, registerWave, waveId, viewer]);

  let competitionContent: ReactNode;
  if (competitionId) {
    competitionContent = (
      <CompetitionWaveContent
        key={`${competitionId}:${viewer ?? "anonymous"}`}
        waveId={waveId}
        competitionId={competitionId}
      />
    );
  } else if (isCompetitionPathname(pathname)) {
    competitionContent = pathname.endsWith("/new") ? (
      <CompetitionDraftRoute
        key={`${waveId}:${viewer ?? "anonymous"}`}
        waveId={waveId}
      />
    ) : (
      <CompetitionHub waveId={waveId} embedded />
    );
  }
  return (
    <MyStreamWave
      key={`${waveId}:${viewer ?? "anonymous"}`}
      waveId={waveId}
      competitionContent={competitionContent}
    />
  );
}
