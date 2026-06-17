import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiGlobalRepCategoryGiversPage } from "@/generated/models/ApiGlobalRepCategoryGiversPage";
import type { ApiGlobalRepCategoryOverview } from "@/generated/models/ApiGlobalRepCategoryOverview";
import type { ApiGlobalRepCategoryRatingsPage } from "@/generated/models/ApiGlobalRepCategoryRatingsPage";
import type { ApiGlobalRepCategoryRecipientsPage } from "@/generated/models/ApiGlobalRepCategoryRecipientsPage";
import type { ApiWaveRepCategoriesPage } from "@/generated/models/ApiWaveRepCategoriesPage";
import type { ApiWaveRepCategory } from "@/generated/models/ApiWaveRepCategory";
import type { ApiWaveRepContributorsPage } from "@/generated/models/ApiWaveRepContributorsPage";
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

export const getGlobalRepCategoryPageQueryKey = ({
  category,
  tab,
  sort,
}: {
  readonly category: string;
  readonly tab: Exclude<GlobalRepCategoryTab, "overview">;
  readonly sort: GlobalRepCategorySort;
}) => [QueryKey.GLOBAL_REP_CATEGORY_PAGE, { category, tab, sort }];

export const getWaveRepCategoryQueryKey = ({
  waveId,
  category,
}: {
  readonly waveId: string;
  readonly category: string;
}) => [QueryKey.WAVE_REP_CATEGORY, { waveId, category }];

export const getWaveRepCategoryContributorsQueryKey = ({
  waveId,
  category,
}: {
  readonly waveId: string;
  readonly category: string;
}) => [QueryKey.WAVE_REP_CATEGORY_CONTRIBUTORS, { waveId, category }];

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
    endpoint: "/rep/categories",
    params: { param: term },
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

export async function fetchWaveRepCategorySummary({
  waveId,
  category,
}: {
  readonly waveId: string;
  readonly category: string;
}): Promise<ApiWaveRepCategory | null> {
  const response = await commonApiFetch<ApiWaveRepCategoriesPage>({
    endpoint: `waves/${waveId}/rep/categories`,
    params: {
      page: "1",
      page_size: "100",
      top_contributors_limit: "5",
    },
  });
  const normalizedCategory = category.trim().toLowerCase();
  return (
    response.data.find(
      (item) => item.category.trim().toLowerCase() === normalizedCategory
    ) ?? null
  );
}

export async function fetchWaveRepCategoryContributors({
  waveId,
  category,
  page,
}: {
  readonly waveId: string;
  readonly category: string;
  readonly page: number;
}): Promise<ApiWaveRepContributorsPage> {
  return await commonApiFetch<ApiWaveRepContributorsPage>({
    endpoint: `waves/${waveId}/rep/categories/${encodeRepCategoryPath(
      category
    )}/contributors`,
    params: {
      page: page.toString(),
      page_size: GLOBAL_REP_CATEGORY_PAGE_SIZE.toString(),
    },
  });
}
