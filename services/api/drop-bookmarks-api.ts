import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropsPage } from "@/generated/models/ApiDropsPage";
import type { ApiDropBookmarksStatus } from "@/generated/models/ApiDropBookmarksStatus";
import {
  commonApiFetch,
  commonApiPost,
  commonApiDeleteWithResponse,
} from "./common-api";

export const fetchBookmarkStatus = (signal?: AbortSignal, dropId?: string) =>
  commonApiFetch<ApiDropBookmarksStatus>({
    endpoint: "drops-bookmarked/status",
    signal,
    cache: "no-store",
    ...(dropId ? { params: { drop_id: dropId } } : {}),
  });
export const fetchBookmarks = (page: number, signal?: AbortSignal) =>
  commonApiFetch<ApiDropsPage>({
    endpoint: "drops-bookmarked/",
    params: { page: String(page), page_size: "25", sort_direction: "DESC" },
    signal,
    cache: "no-store",
  });
export const updateDropBookmark = (dropId: string, bookmarked: boolean) =>
  bookmarked
    ? commonApiPost<undefined, ApiDrop>({
        endpoint: `drops/${encodeURIComponent(dropId)}/bookmark`,
        body: undefined,
      })
    : commonApiDeleteWithResponse<ApiDrop>({
        endpoint: `drops/${encodeURIComponent(dropId)}/bookmark`,
      });
