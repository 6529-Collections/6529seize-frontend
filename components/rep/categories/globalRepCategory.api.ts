import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiGlobalRepCategoryGiversPage } from "@/generated/models/ApiGlobalRepCategoryGiversPage";
import type { ApiGlobalRepCategoryOverview } from "@/generated/models/ApiGlobalRepCategoryOverview";
import type { ApiGlobalRepCategoryRatingsPage } from "@/generated/models/ApiGlobalRepCategoryRatingsPage";
import type { ApiGlobalRepCategoryRecipientsPage } from "@/generated/models/ApiGlobalRepCategoryRecipientsPage";
import type { ApiGlobalRepCategorySuggestedCategory } from "@/generated/models/ApiGlobalRepCategorySuggestedCategory";
import type { ApiGlobalRepCategoryWaveContributorsPage } from "@/generated/models/ApiGlobalRepCategoryWaveContributorsPage";
import type { ApiGlobalRepCategoryWaveOverview } from "@/generated/models/ApiGlobalRepCategoryWaveOverview";
import type { ApiGlobalRepCategoryWavesPage } from "@/generated/models/ApiGlobalRepCategoryWavesPage";
import { commonApiFetch } from "@/services/api/common-api";
import {
  GLOBAL_REP_CATEGORY_PAGE_SIZE,
  encodeRepCategoryPath,
  type GlobalRepCategorySort,
  type GlobalRepCategoryTab,
} from "./globalRepCategory.helpers";

type ApiSortParams = {
  readonly order: "ASC" | "DESC";
  readonly order_by: "rep" | "last_modified";
};

type GlobalRepCategoryWaveVisibilityScope = {
  readonly viewerProfileId: string | null;
  readonly proxyId: string | null;
  readonly proxyCanReadWave: boolean;
};

type GlobalRepCategoryPage =
  | ({ readonly tab: "recipients" } & ApiGlobalRepCategoryRecipientsPage)
  | ({ readonly tab: "givers" } & ApiGlobalRepCategoryGiversPage)
  | ({ readonly tab: "pairings" | "recent" } & ApiGlobalRepCategoryRatingsPage);

export const getGlobalRepCategoryOverviewQueryKey = (category: string) => [
  QueryKey.GLOBAL_REP_CATEGORY_OVERVIEW,
  { category },
];

export const getGlobalRepCategorySearchQueryKey = (term: string) => [
  QueryKey.GLOBAL_REP_CATEGORY_SEARCH,
  { term },
];

export const getGlobalRepCategorySuggestedQueryKey = () => [
  QueryKey.GLOBAL_REP_CATEGORY_SUGGESTED,
];

export const getGlobalRepCategoryPageQueryKey = ({
  category,
  tab,
  sort,
}: {
  readonly category: string;
  readonly tab: Exclude<GlobalRepCategoryTab, "overview">;
  readonly sort: GlobalRepCategorySort;
}) => [QueryKey.GLOBAL_REP_CATEGORY_PAGE, { category, tab, sort }];

export const getGlobalRepCategoryWaveOverviewQueryKey = ({
  category,
  visibilityScope,
}: {
  readonly category: string;
  readonly visibilityScope: GlobalRepCategoryWaveVisibilityScope;
}) => [
  QueryKey.GLOBAL_REP_CATEGORY_WAVE_OVERVIEW,
  { category, visibilityScope },
];

export const getGlobalRepCategoryWavesPageQueryKey = ({
  category,
  sort,
  visibilityScope,
}: {
  readonly category: string;
  readonly sort: GlobalRepCategorySort;
  readonly visibilityScope: GlobalRepCategoryWaveVisibilityScope;
}) => [
  QueryKey.GLOBAL_REP_CATEGORY_WAVES_PAGE,
  { category, sort, visibilityScope },
];

export const getGlobalRepCategoryWaveContributorsPageQueryKey = ({
  category,
  sort,
  visibilityScope,
}: {
  readonly category: string;
  readonly sort: GlobalRepCategorySort;
  readonly visibilityScope: GlobalRepCategoryWaveVisibilityScope;
}) => [
  QueryKey.GLOBAL_REP_CATEGORY_WAVE_CONTRIBUTORS_PAGE,
  { category, sort, visibilityScope },
];

const getSortParams = (sort: GlobalRepCategorySort): ApiSortParams => {
  if (sort === "rep_asc") {
    return { order: "ASC", order_by: "rep" };
  }

  if (sort === "recent") {
    return { order: "DESC", order_by: "last_modified" };
  }

  return { order: "DESC", order_by: "rep" };
};

export async function searchGlobalRepCategories(
  term: string
): Promise<string[]> {
  return await commonApiFetch<string[]>({
    endpoint: "rep/categories",
    params: { param: term },
  });
}

export async function fetchSuggestedRepCategories(): Promise<
  ApiGlobalRepCategorySuggestedCategory[]
> {
  return await commonApiFetch<ApiGlobalRepCategorySuggestedCategory[]>({
    endpoint: "rep/categories/top",
  });
}

export async function fetchGlobalRepCategoryOverview(
  category: string
): Promise<ApiGlobalRepCategoryOverview> {
  return await commonApiFetch<ApiGlobalRepCategoryOverview>({
    endpoint: `rep/categories/${encodeRepCategoryPath(category)}/overview`,
  });
}

export async function fetchGlobalRepCategoryPage({
  category,
  tab,
  sort,
  page,
}: {
  readonly category: string;
  readonly tab: Exclude<GlobalRepCategoryTab, "overview">;
  readonly sort: GlobalRepCategorySort;
  readonly page: number;
}): Promise<GlobalRepCategoryPage> {
  const params = {
    ...getSortParams(tab === "recent" ? "recent" : sort),
    page: page.toString(),
    page_size: GLOBAL_REP_CATEGORY_PAGE_SIZE.toString(),
  };
  const encodedCategory = encodeRepCategoryPath(category);

  if (tab === "recipients") {
    const response = await commonApiFetch<ApiGlobalRepCategoryRecipientsPage>({
      endpoint: `rep/categories/${encodedCategory}/recipients`,
      params,
    });
    return { ...response, tab };
  }

  if (tab === "givers") {
    const response = await commonApiFetch<ApiGlobalRepCategoryGiversPage>({
      endpoint: `rep/categories/${encodedCategory}/givers`,
      params,
    });
    return { ...response, tab };
  }

  const response = await commonApiFetch<ApiGlobalRepCategoryRatingsPage>({
    endpoint: `rep/categories/${encodedCategory}/ratings`,
    params,
  });
  return { ...response, tab };
}

export async function fetchGlobalRepCategoryWaveOverview(
  category: string
): Promise<ApiGlobalRepCategoryWaveOverview> {
  return await commonApiFetch<ApiGlobalRepCategoryWaveOverview>({
    endpoint: `rep/categories/${encodeRepCategoryPath(category)}/wave-overview`,
  });
}

export async function fetchGlobalRepCategoryWavesPage({
  category,
  sort,
  page,
}: {
  readonly category: string;
  readonly sort: GlobalRepCategorySort;
  readonly page: number;
}): Promise<ApiGlobalRepCategoryWavesPage> {
  return await commonApiFetch<ApiGlobalRepCategoryWavesPage>({
    endpoint: `rep/categories/${encodeRepCategoryPath(category)}/waves`,
    params: {
      ...getSortParams(sort),
      page: page.toString(),
      page_size: GLOBAL_REP_CATEGORY_PAGE_SIZE.toString(),
    },
  });
}

export async function fetchGlobalRepCategoryWaveContributorsPage({
  category,
  sort,
  page,
}: {
  readonly category: string;
  readonly sort: GlobalRepCategorySort;
  readonly page: number;
}): Promise<ApiGlobalRepCategoryWaveContributorsPage> {
  return await commonApiFetch<ApiGlobalRepCategoryWaveContributorsPage>({
    endpoint: `rep/categories/${encodeRepCategoryPath(
      category
    )}/wave-contributors`,
    params: {
      ...getSortParams(sort),
      page: page.toString(),
      page_size: GLOBAL_REP_CATEGORY_PAGE_SIZE.toString(),
    },
  });
}
