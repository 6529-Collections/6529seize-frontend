import type { TimeLeft } from "@/helpers/waves/time.utils";
import { CompactPhaseStatus } from "./CompactPhaseStatus";

interface CompactWinnerAnnouncementProps {
  readonly timestamp: number;
  readonly timeLeft: TimeLeft;
}

export function CompactWinnerAnnouncement({
  timestamp,
  timeLeft,
}: CompactWinnerAnnouncementProps) {
  return (
    <CompactPhaseStatus
      labelKey="waves.leaderboard.phase.nextWinnersIn"
      timestamp={timestamp}
      timeLeft={timeLeft}
    />
  );
}
