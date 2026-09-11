import { isHelpBotCreditRepCategory } from "@/components/utils/input/rep-category/repCategoryConstants";
import {
  isMemesNomineeSearchPrefix,
  MEMES_NOMINEE_CATEGORY,
} from "@/helpers/waves/memes-nomination";

export function getGrantRepCategoriesToDisplay({
  search,
  categories,
  includeTypedCategory,
}: {
  readonly search: string;
  readonly categories: readonly string[];
  readonly includeTypedCategory: boolean;
}): string[] {
  const items: string[] = [];
  const shouldSurfaceSubmissionCategory =
    includeTypedCategory && isMemesNomineeSearchPrefix(search);

  if (shouldSurfaceSubmissionCategory && search !== MEMES_NOMINEE_CATEGORY) {
    items.push(MEMES_NOMINEE_CATEGORY);
  }
  if (includeTypedCategory && !isHelpBotCreditRepCategory(search)) {
    items.push(search);
  }
  items.push(
    ...categories.filter(
      (category) =>
        category !== search &&
        (!shouldSurfaceSubmissionCategory ||
          category !== MEMES_NOMINEE_CATEGORY) &&
        !isHelpBotCreditRepCategory(category)
    )
  );

  return items;
}
