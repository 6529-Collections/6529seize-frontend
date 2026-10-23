"use client";

import WaveRouteShell from "@/components/waves/WaveRouteShell";

export default function CompetitionRoute({
  waveId,
}: {
  readonly waveId: string;
  readonly competitionId?: string;
}) {
  return <WaveRouteShell waveId={waveId} />;
}
