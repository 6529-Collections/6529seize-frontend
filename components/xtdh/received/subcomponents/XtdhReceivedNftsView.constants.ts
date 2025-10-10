import type { XtdhReceivedNftsViewEmptyCopy } from "./XtdhReceivedNftsView.types";

export const DEFAULT_CLEAR_FILTERS_LABEL = "Clear filters";

export const DEFAULT_EMPTY_STATE_COPY: XtdhReceivedNftsViewEmptyCopy = {
  defaultMessage:
    "You don't hold any NFTs currently receiving xTDH grants. When others grant xTDH to collections you hold, they will appear here.",
  filteredMessage: "No NFTs match your filters.",
  filteredActionLabel: DEFAULT_CLEAR_FILTERS_LABEL,
};
