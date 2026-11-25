import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  isMemesNomineeLookalike,
  MEMES_NOMINEE_CATEGORY,
  MEMES_NOMINEE_REQUIRED_REP,
} from "@/helpers/waves/memes-nomination";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

function getSubmissionGuidanceContent(
  submissionHint: string,
  submissionLookalikeInfo: string | null,
  hasSelectedSubmissionCategory: boolean
): React.ReactNode {
  const submissionCategoryStart = submissionHint.indexOf(
    MEMES_NOMINEE_CATEGORY
  );
  if (submissionLookalikeInfo) {
    return submissionLookalikeInfo;
  }
  if (submissionCategoryStart >= 0) {
    return (
      <>
        {submissionHint.slice(0, submissionCategoryStart)}
        <span
          className={`tw-font-medium ${
            hasSelectedSubmissionCategory
              ? "tw-text-emerald-400"
              : "tw-text-iron-200"
          }`}
        >
          {MEMES_NOMINEE_CATEGORY}
        </span>
        {submissionHint.slice(
          submissionCategoryStart + MEMES_NOMINEE_CATEGORY.length
        )}
      </>
    );
  }
  return submissionHint;
}

export default function GrantRepSubmissionGuidance({
  id,
  selectedCategory,
  categoriesToDisplay,
  search = "",
}: {
  readonly id: string;
  readonly selectedCategory: string | null;
  readonly categoriesToDisplay: readonly string[];
  readonly search?: string;
}) {
  const locale = useBrowserLocale();
  const hasSelectedSubmissionCategory =
    selectedCategory === MEMES_NOMINEE_CATEGORY;
  const guidanceCategory = selectedCategory ?? search;
  const selectedNonQualifyingLookalike =
    guidanceCategory && isMemesNomineeLookalike(guidanceCategory)
      ? guidanceCategory
      : null;
  const showSubmissionSearchHint =
    !selectedCategory && categoriesToDisplay.includes(MEMES_NOMINEE_CATEGORY);
  const showSubmissionGuidance =
    hasSelectedSubmissionCategory ||
    !!selectedNonQualifyingLookalike ||
    showSubmissionSearchHint;
  const submissionHint = t(locale, "rep.categories.grant.submissionHint", {
    category: MEMES_NOMINEE_CATEGORY,
    amount: formatNumberWithCommas(MEMES_NOMINEE_REQUIRED_REP),
  });
  const submissionLookalikeInfo = selectedNonQualifyingLookalike
    ? t(locale, "rep.categories.grant.submissionLookalikeInfo", {
        category: selectedNonQualifyingLookalike,
        submissionCategory: MEMES_NOMINEE_CATEGORY,
      })
    : null;
  const submissionGuidanceContent = getSubmissionGuidanceContent(
    submissionHint,
    submissionLookalikeInfo,
    hasSelectedSubmissionCategory
  );

  return (
    <output
      id={id}
      hidden={!showSubmissionGuidance}
      className={`tw-mb-0 tw-mt-2 tw-items-start tw-gap-1.5 tw-text-xs tw-font-normal tw-leading-5 ${showSubmissionGuidance ? "tw-flex" : "tw-hidden"} ${
        selectedNonQualifyingLookalike
          ? "tw-text-amber-300"
          : "tw-text-iron-400"
      }`}
    >
      {selectedNonQualifyingLookalike && (
        <InformationCircleIcon
          aria-hidden="true"
          className="tw-mt-0.5 tw-h-3.5 tw-w-3.5 tw-flex-shrink-0"
        />
      )}
      <span>{showSubmissionGuidance ? submissionGuidanceContent : null}</span>
    </output>
  );
}
