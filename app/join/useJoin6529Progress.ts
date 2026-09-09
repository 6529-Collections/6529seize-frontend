import { useMemo } from "react";

import { buildJoinJourneyProgress } from "./journeyProgress";
import type { Join6529Facts } from "./journeyFacts";
import type { JoinPageState, TimelineProgress } from "./page.types";

export function useJoin6529Progress({
  facts,
  pageState,
  hideNftPurchasing = false,
}: {
  readonly facts: Join6529Facts;
  readonly pageState: JoinPageState;
  readonly hideNftPurchasing?: boolean;
}): TimelineProgress {
  return useMemo(
    () => buildJoinJourneyProgress(pageState, facts, hideNftPurchasing),
    [facts, pageState, hideNftPurchasing]
  );
}
