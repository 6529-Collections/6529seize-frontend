import type { ApiGlobalRepCategoryOverview } from "@/generated/models/ApiGlobalRepCategoryOverview";
import { MEMES_NOMINEE_CATEGORY } from "@/helpers/waves/memes-nomination";
import { commonApiFetch } from "@/services/api/common-api";
import { isHelpBotCreditRepCategory } from "@/components/utils/input/rep-category/repCategoryConstants";

const MIN_SEARCH_LENGTH = 3;
const MAX_SEARCH_LENGTH = 100;

type GrantRepCategorySelectionReason =
  | "existing"
  | "most-active"
  | "submission";

export interface ExistingGrantRepCategoryOption {
  readonly kind: "existing";
  readonly category: string;
  readonly aliases: readonly string[];
  readonly selectionReason: GrantRepCategorySelectionReason;
}

export interface NewGrantRepCategoryOption {
  readonly kind: "new";
  readonly category: string;
}

export type GrantRepCategoryOption =
  | ExistingGrantRepCategoryOption
  | NewGrantRepCategoryOption;

interface RepCategoryActivity {
  readonly category: string;
  readonly pairCount: number;
  readonly totalRep: number;
}

interface RepCategoryGroup {
  readonly key: string;
  readonly variants: readonly string[];
  readonly firstIndex: number;
}

const countCodePoints = (value: string): number => Array.from(value).length;

export function cleanRepCategoryName(category: string): string {
  return category
    .normalize("NFKC")
    .replace(/[\p{Z}\s]+/gu, " ")
    .trim();
}

export function getRepCategoryMatchKey(category: string): string {
  return cleanRepCategoryName(category)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

const separateCamelCase = (value: string): string =>
  value
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2");

export function getRepCategorySearchTerms(category: string): string[] {
  const cleaned = cleanRepCategoryName(category);
  const separatorsAsSpaces = cleanRepCategoryName(
    cleaned.replace(/\p{P}+/gu, " ")
  );
  const camelCaseSpaced = cleanRepCategoryName(
    separateCamelCase(separatorsAsSpaces)
  );
  const compact = getRepCategoryMatchKey(cleaned);
  const termsByLowerCase = new Map<string, string>();

  for (const term of [cleaned, separatorsAsSpaces, camelCaseSpaced, compact]) {
    const length = countCodePoints(term);
    if (length < MIN_SEARCH_LENGTH || length > MAX_SEARCH_LENGTH) continue;
    const key = term.toLowerCase();
    if (!termsByLowerCase.has(key)) {
      termsByLowerCase.set(key, term);
    }
  }

  return [...termsByLowerCase.values()];
}

const groupCategories = (categories: readonly string[]): RepCategoryGroup[] => {
  const groups = new Map<string, { variants: string[]; firstIndex: number }>();

  categories.forEach((category, index) => {
    const key = getRepCategoryMatchKey(category);
    if (!key || isHelpBotCreditRepCategory(category)) return;
    const group = groups.get(key);
    if (!group) {
      groups.set(key, { variants: [category], firstIndex: index });
      return;
    }
    if (!group.variants.includes(category)) {
      group.variants.push(category);
    }
  });

  return [...groups.entries()].map(([key, group]) => ({ key, ...group }));
};

const getActivityScore = (
  category: string,
  activityByCategory: ReadonlyMap<string, RepCategoryActivity>
): readonly [number, number] => {
  const activity = activityByCategory.get(category);
  return activity
    ? [activity.pairCount, Math.abs(activity.totalRep)]
    : [-1, -1];
};

const getPreferredVariant = ({
  group,
  activityByCategory,
}: {
  readonly group: RepCategoryGroup;
  readonly activityByCategory: ReadonlyMap<string, RepCategoryActivity>;
}): {
  readonly category: string;
  readonly reason: GrantRepCategorySelectionReason;
} => {
  if (group.key === getRepCategoryMatchKey(MEMES_NOMINEE_CATEGORY)) {
    return { category: MEMES_NOMINEE_CATEGORY, reason: "submission" };
  }

  if (group.variants.length === 1) {
    return { category: group.variants[0]!, reason: "existing" };
  }

  const ranked = [...group.variants].sort((left, right) => {
    const [leftPairs, leftRep] = getActivityScore(left, activityByCategory);
    const [rightPairs, rightRep] = getActivityScore(right, activityByCategory);
    return rightPairs - leftPairs || rightRep - leftRep;
  });
  const category = ranked[0]!;
  const reason = activityByCategory.has(category) ? "most-active" : "existing";
  return { category, reason };
};

export function buildGrantRepCategoryOptions({
  search,
  categories,
  activities = [],
}: {
  readonly search: string;
  readonly categories: readonly string[];
  readonly activities?: readonly RepCategoryActivity[];
}): GrantRepCategoryOption[] {
  const cleanedSearch = cleanRepCategoryName(search);
  const searchKey = getRepCategoryMatchKey(cleanedSearch);
  const uniqueCategories = [...new Set(categories)];

  if (searchKey === getRepCategoryMatchKey(MEMES_NOMINEE_CATEGORY)) {
    uniqueCategories.unshift(MEMES_NOMINEE_CATEGORY);
  }

  const groups = groupCategories(uniqueCategories).sort((left, right) => {
    const leftExact = left.key === searchKey ? 0 : 1;
    const rightExact = right.key === searchKey ? 0 : 1;
    return leftExact - rightExact || left.firstIndex - right.firstIndex;
  });
  const activityByCategory = new Map(
    activities.map((activity) => [activity.category, activity])
  );
  const options: GrantRepCategoryOption[] = groups.map((group) => {
    const preferred = getPreferredVariant({ group, activityByCategory });
    return {
      kind: "existing",
      category: preferred.category,
      aliases: group.variants.filter(
        (category) => category !== preferred.category
      ),
      selectionReason: preferred.reason,
    };
  });

  const hasEquivalentExistingCategory = groups.some(
    (group) => group.key === searchKey
  );
  if (
    cleanedSearch &&
    !hasEquivalentExistingCategory &&
    !isHelpBotCreditRepCategory(cleanedSearch)
  ) {
    options.push({ kind: "new", category: cleanedSearch });
  }

  return options;
}

const fetchCategoryActivity = async (
  category: string,
  signal: AbortSignal
): Promise<RepCategoryActivity | null> => {
  try {
    const overview = await commonApiFetch<ApiGlobalRepCategoryOverview>({
      endpoint: `rep/categories/${encodeURIComponent(category)}/overview`,
      signal,
    });
    return {
      category,
      pairCount: overview.pair_count,
      totalRep: overview.total_rep,
    };
  } catch (error) {
    if (signal.aborted) throw error;
    return null;
  }
};

export async function searchGrantRepCategoryOptions({
  search,
  signal,
}: {
  readonly search: string;
  readonly signal: AbortSignal;
}): Promise<GrantRepCategoryOption[]> {
  const searchTerms = getRepCategorySearchTerms(search);
  const searchResults = await Promise.all(
    searchTerms.map(
      async (term) =>
        await commonApiFetch<string[]>({
          endpoint: "rep/categories",
          params: { param: term },
          signal,
        })
    )
  );
  const categories = [...new Set(searchResults.flat())];
  const groups = groupCategories(categories);
  const duplicateVariants = groups.flatMap((group) =>
    group.variants.length > 1 &&
    group.key !== getRepCategoryMatchKey(MEMES_NOMINEE_CATEGORY)
      ? group.variants
      : []
  );
  const activityResults = await Promise.all(
    duplicateVariants.map(
      async (category) => await fetchCategoryActivity(category, signal)
    )
  );

  return buildGrantRepCategoryOptions({
    search,
    categories,
    activities: activityResults.filter(
      (activity): activity is RepCategoryActivity => activity !== null
    ),
  });
}
