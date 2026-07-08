import { useMemo } from "react";

import { buildJoinJourneyProgress } from "./journeyProgress";
import type { JoinPageState, TimelineProgress } from "./page.types";

export function useJoin6529Progress({
  pageState,
}: {
  readonly pageState: JoinPageState;
}): TimelineProgress {
  return useMemo(() => buildJoinJourneyProgress(pageState), [pageState]);
}
