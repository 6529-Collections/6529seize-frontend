"use client";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  fetchBookmarks,
  fetchBookmarkStatus,
} from "@/services/api/drop-bookmarks-api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export const bookmarkKey = (owner: string | null) =>
  [QueryKey.DROP_BOOKMARKS, owner] as const;
export function useBookmarkOwner() {
  const { connectedProfile, isAuthenticated } = useAuth();
  return isAuthenticated === true ? (connectedProfile?.id ?? null) : null;
}
export function useBookmarkStatus() {
  const owner = useBookmarkOwner();
  const query = useQuery({
    queryKey: [...bookmarkKey(owner), "status"],
    queryFn: ({ signal }) => fetchBookmarkStatus(signal),
    enabled: !!owner,
    staleTime: 30_000,
    gcTime: 0,
    meta: { persist: false },
  });
  return {
    ...query,
    owner,
    hasBookmarks: !!owner && (query.data?.count ?? 0) > 0,
  };
}
export function useBookmarks() {
  const owner = useBookmarkOwner();
  return useInfiniteQuery({
    queryKey: [...bookmarkKey(owner), "list"],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchBookmarks(pageParam, signal),
    getNextPageParam: (last) => (last.next ? last.page + 1 : undefined),
    enabled: !!owner,
    gcTime: 0,
    meta: { persist: false },
  });
}
