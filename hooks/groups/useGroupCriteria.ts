"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { commonApiFetch } from "@/services/api/common-api";

export interface GroupCriteria {
  readonly group: ApiGroupFull | null;
  readonly includedWallets: readonly string[];
  readonly excludedWallets: readonly string[];
}

const normalizeWallets = (wallets: readonly string[]): string[] => [
  ...new Set(
    wallets.map((wallet) => wallet.trim().toLowerCase()).filter(Boolean)
  ),
];

export function useGroupCriteria(groupId: string | null): {
  readonly criteria: GroupCriteria | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly retry: () => void;
} {
  const normalizedGroupId = groupId ?? "";
  const groupQuery = useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUP, normalizedGroupId],
    queryFn: async ({ signal }) =>
      await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${encodeURIComponent(normalizedGroupId)}`,
        signal,
      }),
    enabled: groupId !== null,
    staleTime: 60_000,
  });
  const group = groupQuery.data ?? null;
  const includedIdentityGroupId = group?.group.identity_group_id ?? null;
  const excludedIdentityGroupId =
    group?.group.excluded_identity_group_id ?? null;

  const includedWalletsQuery = useQuery<string[]>({
    queryKey: [
      QueryKey.GROUP_WALLET_GROUP_WALLETS,
      {
        group_id: normalizedGroupId,
        wallet_group_id: includedIdentityGroupId,
      },
    ],
    queryFn: async ({ signal }) =>
      normalizeWallets(
        await commonApiFetch<string[]>({
          endpoint: `groups/${encodeURIComponent(
            normalizedGroupId
          )}/identity_groups/${encodeURIComponent(
            includedIdentityGroupId ?? ""
          )}`,
          signal,
        })
      ),
    enabled: group !== null && includedIdentityGroupId !== null,
    staleTime: 60_000,
  });
  const excludedWalletsQuery = useQuery<string[]>({
    queryKey: [
      QueryKey.GROUP_WALLET_GROUP_WALLETS,
      {
        group_id: normalizedGroupId,
        wallet_group_id: excludedIdentityGroupId,
      },
    ],
    queryFn: async ({ signal }) =>
      normalizeWallets(
        await commonApiFetch<string[]>({
          endpoint: `groups/${encodeURIComponent(
            normalizedGroupId
          )}/identity_groups/${encodeURIComponent(
            excludedIdentityGroupId ?? ""
          )}`,
          signal,
        })
      ),
    enabled: group !== null && excludedIdentityGroupId !== null,
    staleTime: 60_000,
  });

  const includedWallets =
    includedIdentityGroupId === null ? [] : includedWalletsQuery.data;
  const excludedWallets =
    excludedIdentityGroupId === null ? [] : excludedWalletsQuery.data;
  const isError =
    groupQuery.isError ||
    includedWalletsQuery.isError ||
    excludedWalletsQuery.isError;
  let criteria: GroupCriteria | null = null;
  if (groupId === null) {
    criteria = { group: null, includedWallets: [], excludedWallets: [] };
  } else if (group && includedWallets && excludedWallets) {
    criteria = { group, includedWallets, excludedWallets };
  }
  const isLoading = groupId !== null && !isError && criteria === null;
  const retry = useCallback(() => {
    void groupQuery.refetch();
    if (group !== null && includedIdentityGroupId !== null) {
      void includedWalletsQuery.refetch();
    }
    if (group !== null && excludedIdentityGroupId !== null) {
      void excludedWalletsQuery.refetch();
    }
  }, [
    excludedIdentityGroupId,
    excludedWalletsQuery,
    group,
    groupQuery,
    includedIdentityGroupId,
    includedWalletsQuery,
  ]);

  return { criteria, isLoading, isError, retry };
}
