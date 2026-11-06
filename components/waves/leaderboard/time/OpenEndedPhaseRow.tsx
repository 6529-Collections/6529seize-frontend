import { CompactPhaseStatus } from "./CompactPhaseStatus";

/** Compact status for phases without an end date, rather than a countdown. */
export function OpenEndedPhaseRow({
  labelKey,
}: {
  readonly labelKey:
    | "waves.leaderboard.phase.votingOngoing"
    | "waves.leaderboard.phase.droppingOngoing";
}) {
  return (
    <CompactPhaseStatus
      labelKey={labelKey}
      detailKey="waves.leaderboard.phase.noEndDate"
    />
  );
}
