import type { XtdhReceivedCollectionsViewEmptyCopy } from "./XtdhReceivedCollectionsView.types";

export const DEFAULT_CLEAR_FILTERS_LABEL = "Clear filters";

export const DEFAULT_EMPTY_STATE_COPY: XtdhReceivedCollectionsViewEmptyCopy = {
  defaultMessage:
    "You haven't received any xTDH grants for your collections yet. Once granters allocate xTDH to collections you hold, they will appear here.",
  filtersMessage: "No collections match your filters.",
  filtersActionLabel: DEFAULT_CLEAR_FILTERS_LABEL,
} as const;
