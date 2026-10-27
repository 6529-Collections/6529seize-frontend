"use client";
import { useAuth } from "@/components/auth/Auth";
import type { ApiDropBookmarksStatus } from "@/generated/models/ApiDropBookmarksStatus";
import type { ApiDropsPage } from "@/generated/models/ApiDropsPage";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  fetchBookmarkStatus,
  updateDropBookmark,
} from "@/services/api/drop-bookmarks-api";
import { getWalletAddress } from "@/services/auth/auth.utils";
import {
  type InfiniteData,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { bookmarkKey, useBookmarkOwner } from "./useDropBookmarks";

export function useDropBookmarkMutation(
  dropId: string,
  knownBookmarked?: boolean
) {
  const owner = useBookmarkOwner();
  const queryClient = useQueryClient();
  const { setToast } = useAuth();
  const locale = useBrowserLocale();
  const rootKey = bookmarkKey(owner);
  const statusKey = [...rootKey, "status"];
  const dropKey = [...rootKey, "drop", dropId];
  const listKey = [...rootKey, "list"];
  const mutationKey = [...rootKey, "mutation"];
  const busy = useIsMutating({ mutationKey }) > 0;
  const state = useQuery({
    queryKey: dropKey,
    queryFn: ({ signal }) => fetchBookmarkStatus(signal, dropId),
    enabled: !!owner && knownBookmarked === undefined,
    ...(knownBookmarked === undefined
      ? {}
      : { initialData: { count: 0, bookmarked: knownBookmarked } }),
    staleTime: 30_000,
    gcTime: 0,
    meta: { persist: false },
  });
  const mutation = useMutation({
    mutationKey,
    mutationFn: (bookmarked: boolean) => updateDropBookmark(dropId, bookmarked),
    onMutate: async (bookmarked: boolean) => {
      const wallet = getWalletAddress();
      await queryClient.cancelQueries({ queryKey: rootKey });
      const previousDrop =
        queryClient.getQueryData<ApiDropBookmarksStatus>(dropKey);
      const previousList =
        queryClient.getQueryData<InfiniteData<ApiDropsPage>>(listKey);
      const previousStatus = queryClient.getQueryData<ApiDropBookmarksStatus>(
        statusKey
      ) ?? { count: previousList?.pages[0]?.count ?? state.data?.count ?? 0 };
      const count = Math.max(0, previousStatus.count + (bookmarked ? 1 : -1));
      queryClient.setQueryData(statusKey, { count });
      queryClient.setQueryData(dropKey, { count, bookmarked });
      if (!bookmarked && previousList)
        queryClient.setQueryData<InfiniteData<ApiDropsPage>>(listKey, {
          ...previousList,
          pages: previousList.pages.map((page) => ({
            ...page,
            count,
            data: page.data.filter((drop) => drop.id !== dropId),
          })),
        });
      return { previousStatus, previousDrop, previousList, wallet };
    },
    onError: (_error, _bookmarked, context) => {
      queryClient.setQueryData(statusKey, context?.previousStatus);
      queryClient.setQueryData(dropKey, context?.previousDrop);
      queryClient.setQueryData(listKey, context?.previousList);
      if (context?.wallet === getWalletAddress())
        setToast({ type: "error", message: t(locale, "bookmarks.saveError") });
    },
    onSuccess: (_drop, bookmarked, context) => {
      if (context.wallet !== getWalletAddress()) return;
      setToast({
        type: "success",
        message: t(
          locale,
          bookmarked ? "bookmarks.saved" : "bookmarks.removed"
        ),
        ...(bookmarked
          ? {
              action: {
                label: t(locale, "bookmarks.view"),
                href: "/bookmarks",
              },
            }
          : {}),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: rootKey });
    },
  });
  return {
    bookmarked: state.data?.bookmarked === true,
    canBookmark: !!owner,
    pending: busy || mutation.isPending || state.isLoading,
    failed: state.isError,
    retry: state.refetch,
    toggle: () => {
      if (!busy && !mutation.isPending && state.data)
        mutation.mutate(!state.data.bookmarked);
    },
  };
}
