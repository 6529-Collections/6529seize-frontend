import { isHelpBotCreditRepCategory } from "@/components/utils/input/rep-category/repCategoryConstants";
import {
  isMemesNomineeSearchPrefix,
  MEMES_NOMINEE_CATEGORY,
} from "@/helpers/waves/memes-nomination";

export function getGrantRepCategoriesToDisplay({
  search,
  categories,
  showSubmissionSuggestion,
}: {
  readonly search: string;
  readonly categories: readonly string[];
  readonly showSubmissionSuggestion: boolean;
}): string[] {
  const items: string[] = [];
  const shouldSurfaceSubmissionCategory =
    showSubmissionSuggestion && isMemesNomineeSearchPrefix(search);

  if (shouldSurfaceSubmissionCategory && search !== MEMES_NOMINEE_CATEGORY) {
    items.push(MEMES_NOMINEE_CATEGORY);
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
