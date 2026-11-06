import type { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "../query-keys";

export async function refreshProfileRatingLists(
  queryClient: QueryClient,
  matter: "REP" | "NIC"
): Promise<void> {
  // Given uses offset pages sorted by last modification. A save can reorder
  // every page, so return to page one rather than replaying all loaded pages.
  await Promise.all([
    queryClient.resetQueries({
      queryKey: [QueryKey.PROFILE_RATING_LIST, { matter, direction: "given" }],
    }),
    queryClient.invalidateQueries({
      queryKey: [
        QueryKey.PROFILE_RATING_LIST,
        { matter, direction: "received" },
      ],
    }),
  ]);
}
