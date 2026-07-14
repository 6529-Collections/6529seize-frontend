import { useMemo } from "react";

import { buildJoinJourneyProgress } from "./journeyProgress";
import type { Join6529Facts } from "./journeyFacts";
import type { JoinPageState, TimelineProgress } from "./page.types";

export function useJoin6529Progress({
  facts,
  pageState,
}: {
  readonly facts: Join6529Facts;
  readonly pageState: JoinPageState;
}): TimelineProgress {
  return useMemo(
    () => buildJoinJourneyProgress(pageState, facts),
    [facts.hasCollected, facts.hasParticipated, pageState]
  );
}
