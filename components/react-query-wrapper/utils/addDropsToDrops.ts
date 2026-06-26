import type { QueryClient } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  getHelpBotRealtimeDebugSummary,
  isHelpBotRealtimeDebugDrop,
  logHelpBotRealtimeDebug,
} from "@/utils/helpBotRealtimeDebug";

type DropsQueryData = {
  pages?: ApiWaveDropsFeed[] | undefined;
};

type DropsQueryParams = {
  limit: number;
  waveId: string;
  dropId: string | null;
};

const getDropsQueryKey = (params: DropsQueryParams) =>
  [QueryKey.DROPS, params] as const;

type DropsFeedPage = {
  drops?: ApiDrop[] | undefined;
};

type DropsInfiniteData = {
  pages?: DropsFeedPage[] | undefined;
};

type DropsCacheQueryParams = {
  waveId?: unknown;
  dropId?: unknown;
  dropType?: unknown;
  containsMedia?: unknown;
  curationId?: unknown;
};

const updateQueryData = (
  oldData: DropsQueryData | undefined,
  drop: ApiDrop
): DropsQueryData | undefined => {
  if (!oldData?.pages || oldData.pages.length === 0) {
    return oldData;
  }
  const pages = oldData.pages.map((page) => ({
    ...page,
    drops: [...page.drops],
  }));
  if (pages[0]) {
    const existingDropIndex = pages[0].drops.findIndex(
      (cachedDrop) => cachedDrop.id === drop.id
    );
    if (existingDropIndex !== -1) {
      pages[0].drops[existingDropIndex] = drop;
      return { ...oldData, pages };
    }
    pages[0].drops.unshift({
      ...drop,
    });
    return { ...oldData, pages };
  }
  return oldData;
};

const updateDropsQuery = (
  queryClient: QueryClient,
  queryParams: DropsQueryParams,
  drop: ApiDrop
) => {
  const queryKey = getDropsQueryKey(queryParams);
  queryClient.cancelQueries({ queryKey }).catch(() => undefined);
  queryClient.setQueryData<DropsQueryData | undefined>(
    queryKey,
    (oldData) => updateQueryData(oldData, drop),
    {
      updatedAt: Date.now(),
    }
  );
};

export const addDropToDrops = (
  queryClient: QueryClient,
  { drop }: { readonly drop: ApiDrop }
): void => {
  const baseQueryParams: Omit<DropsQueryParams, "dropId"> = {
    limit: 50,
    waveId: drop.wave.id,
  };
  updateDropsQuery(queryClient, { ...baseQueryParams, dropId: null }, drop);
  if (drop.reply_to) {
    updateDropsQuery(
      queryClient,
      { ...baseQueryParams, dropId: drop.reply_to.drop_id },
      drop
    );
  }
};

function hasMedia(drop: ApiDrop): boolean {
  return drop.parts.some((part) => part.media.length > 0);
}

function readDropsQueryParams(queryKey: readonly unknown[]) {
  const params = queryKey[1];
  if (typeof params !== "object" || params === null || Array.isArray(params)) {
    return null;
  }
  return params as DropsCacheQueryParams;
}

function isMatchingDropsQuery(
  params: DropsCacheQueryParams,
  drop: ApiDrop
): boolean {
  if (params.waveId !== drop.wave.id) {
    return false;
  }

  if (
    params.dropType !== undefined &&
    params.dropType !== null &&
    params.dropType !== drop.drop_type
  ) {
    return false;
  }

  if (params.containsMedia === true && !hasMedia(drop)) {
    return false;
  }

  if (params.curationId !== undefined && params.curationId !== null) {
    return false;
  }

  if (params.dropId === undefined || params.dropId === null) {
    return true;
  }

  return (
    typeof params.dropId === "string" &&
    drop.reply_to?.drop_id === params.dropId
  );
}

function upsertDropInQueryData(
  oldData: DropsInfiniteData | undefined,
  drop: ApiDrop
): DropsInfiniteData | undefined {
  if (!oldData?.pages || oldData.pages.length === 0) {
    return oldData;
  }

  const pages = oldData.pages.map((page) => ({
    ...page,
    drops: page.drops ? [...page.drops] : page.drops,
  }));

  for (const page of pages) {
    const pageDrops = page.drops;
    const existingDropIndex = pageDrops?.findIndex(
      (cachedDrop) => cachedDrop.id === drop.id
    );
    if (
      pageDrops &&
      existingDropIndex !== undefined &&
      existingDropIndex !== -1
    ) {
      pageDrops[existingDropIndex] = drop;
      return { ...oldData, pages };
    }
  }

  if (!pages[0]?.drops) {
    return oldData;
  }

  pages[0].drops.unshift(drop);
  return { ...oldData, pages };
}

function getUpsertDebugState(
  oldData: DropsInfiniteData | undefined,
  drop: ApiDrop
) {
  const pages = oldData?.pages ?? [];
  const existingPageIndex = pages.findIndex((page) =>
    page.drops?.some((cachedDrop) => cachedDrop.id === drop.id)
  );

  return {
    existingPageIndex,
    firstPageDropCount: pages[0]?.drops?.length ?? null,
    pageCount: pages.length,
    upsertAction:
      pages.length === 0
        ? "skipped-no-pages"
        : existingPageIndex === -1
          ? "insert-first-page"
          : "replace-existing",
  };
}

export function upsertDropIntoMatchingDropsQueries(
  queryClient: QueryClient,
  { drop }: { readonly drop: ApiDrop }
): void {
  const debugHelpBotDrop = isHelpBotRealtimeDebugDrop(drop);
  const queries = queryClient
    .getQueryCache()
    .findAll({ queryKey: [QueryKey.DROPS] });

  if (debugHelpBotDrop) {
    logHelpBotRealtimeDebug("cache upsert scan", {
      ...getHelpBotRealtimeDebugSummary(drop),
      dropsQueryCount: queries.length,
    });
  }

  for (const query of queries) {
    const params = readDropsQueryParams(query.queryKey);
    const matches = params ? isMatchingDropsQuery(params, drop) : false;

    if (debugHelpBotDrop) {
      logHelpBotRealtimeDebug("cache upsert candidate", {
        ...getHelpBotRealtimeDebugSummary(drop),
        matches,
        params,
      });
    }

    if (!params || !matches) {
      continue;
    }

    queryClient.setQueryData<DropsInfiniteData | undefined>(
      query.queryKey,
      (oldData) => {
        if (debugHelpBotDrop) {
          logHelpBotRealtimeDebug("cache upsert applying", {
            ...getHelpBotRealtimeDebugSummary(drop),
            ...getUpsertDebugState(oldData, drop),
            params,
          });
        }
        return upsertDropInQueryData(oldData, drop);
      },
      { updatedAt: Date.now() }
    );
  }
}
