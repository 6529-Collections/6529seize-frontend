import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropsPage } from "@/generated/models/ApiDropsPage";
import type { ApiDropBookmarksStatus } from "@/generated/models/ApiDropBookmarksStatus";
import {
  flagItem,
  personalChange,
} from "@/lib/personal-records/personal-record-changes";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";
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
/**
 * Bookmarks a drop or removes the bookmark: today's route (it answers the
 * drop), or a private `bookmark` item (null: read the bookmarks again).
 */
export const updateDropBookmark = (dropId: string, bookmarked: boolean) =>
  savePersonalSetting<ApiDrop | null>({
    legacy: () =>
      bookmarked
        ? commonApiPost<undefined, ApiDrop>({
            endpoint: `drops/${encodeURIComponent(dropId)}/bookmark`,
            body: undefined,
          })
        : commonApiDeleteWithResponse<ApiDrop>({
            endpoint: `drops/${encodeURIComponent(dropId)}/bookmark`,
          }),
    change: () =>
      personalChange({ items: [flagItem("bookmark", dropId, bookmarked)] }),
    recordsResult: () => null,
  });
