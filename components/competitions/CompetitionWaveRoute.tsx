"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveV3 } from "@/generated/models/ApiWaveV3";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import { CompetitionProvider } from "@/contexts/CompetitionContext";
import { CompetitionNavigationContext } from "@/contexts/CompetitionNavigationContext";
import {
  useCompetitionDetail,
  useCompetitionHub,
  useCompetitionViewer,
  useDefaultCompetition,
} from "@/hooks/competitions/useCompetitionQueries";
import { useWaveData } from "@/hooks/useWaveData";
import WavesLayout from "@/components/waves/layout/WavesLayout";
import MyStreamWave from "@/components/brain/my-stream/MyStreamWave";
import CompetitionDetail, {
  NativeCompetitionContent,
} from "./CompetitionDetail";
import { CompetitionState } from "./CompetitionState";

function SelectedCompetitionWave({
  wave,
  hub,
  competition,
  initialFlat,
}: {
  readonly wave: ApiWave;
  readonly hub: ApiWaveV3;
  readonly competition: ApiCompetition;
  readonly initialFlat: boolean;
}) {
  // Keep the mounted layout stable when the server default changes. Commands
  // and explicit URLs remain scoped to this competition until navigation.
  const [flat] = useState(initialFlat);
  const legacy = hub.legacy_primary_competition_id === competition.id;
  let content;
  if (!flat)
    content = (
      <CompetitionDetail waveId={wave.id} competitionId={competition.id} />
    );
  else if (!legacy) content = <NativeCompetitionContent embedded />;
  return (
    <CompetitionProvider value={{ wave, hub, competition }}>
      <CompetitionNavigationContext.Provider
        value={{ flat, nativeCompetition: legacy ? null : competition }}
      >
        <WavesLayout>
          <MyStreamWave waveId={wave.id} competitionContent={content} />
        </WavesLayout>
      </CompetitionNavigationContext.Provider>
    </CompetitionProvider>
  );
}

export default function CompetitionWaveRoute({
  waveId,
  competitionId,
}: {
  readonly waveId: string;
  readonly competitionId: string;
}) {
  const search = useSearchParams();
  const viewer = useCompetitionViewer();
  const wave = useWaveData({ waveId, onWaveNotFound: () => undefined });
  const hub = useCompetitionHub(waveId);
  const competition = useCompetitionDetail({ waveId, competitionId });
  const selection = useDefaultCompetition(waveId);
  const implicit = search.get("default") === "1";
  const error = wave.isError || hub.isError || competition.isError;
  if (
    error ||
    !wave.data ||
    !hub.data ||
    !competition.data ||
    (!implicit && selection.isPending && !selection.isFetched)
  ) {
    return (
      <WavesLayout>
        <MyStreamWave
          waveId={waveId}
          competitionContent={
            <CompetitionState
              error={error}
              retry={() => {
                void wave.refetch();
                void hub.refetch();
                void competition.refetch();
                void selection.refetch();
              }}
            />
          }
        />
      </WavesLayout>
    );
  }
  return (
    <SelectedCompetitionWave
      key={`${waveId}:${competitionId}:${viewer ?? "anonymous"}`}
      wave={wave.data}
      hub={hub.data}
      competition={competition.data}
      initialFlat={
        competition.data.lifecycle !== ApiCompetitionLifecycle.Draft &&
        (implicit ||
          (!selection.isError &&
            selection.data?.competition_id === competitionId))
      }
    />
  );
}
