import type { RatingStats } from "@/entities/IProfile";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import TopRaterAvatars from "./header/TopRaterAvatars";

export default function RepCategoryPill({
  rep,
  profileHandle,
  canEdit,
  onEdit,
  compact = false,
}: {
  readonly rep: RatingStats;
  readonly profileHandle: string;
  readonly canEdit: boolean;
  readonly onEdit: (category: string) => void;
  readonly compact?: boolean;
}) {
  const gapClass = compact ? "tw-gap-2" : "tw-gap-2.5";
  const paddingClass = compact ? "tw-px-3 tw-py-2" : "tw-px-4 tw-py-2.5";

  const content = (
    <>
      <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
        {rep.category}
      </span>
      <span className="tw-text-sm tw-font-semibold tw-text-iron-300 group-hover:tw-text-iron-200">
        {formatNumberWithCommas(rep.rating)}
      </span>
      <span className="tw-text-xs tw-text-iron-600">&middot;</span>
      <div className="tw-pointer-events-none">
        <TopRaterAvatars
          handleOrWallet={profileHandle}
          category={rep.category}
          count={5}
        />
      </div>
      <span className="tw-whitespace-nowrap tw-text-xs tw-font-normal tw-text-iron-400">
        {formatNumberWithCommas(rep.contributor_count)}{" "}
        {rep.contributor_count === 1 ? "rater" : "raters"}
      </span>
      {rep.rater_contribution !== 0 && (
        <>
          <span className="tw-text-xs tw-text-iron-600">&middot;</span>
          <span className="tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-text-primary-400">
            My Rate: {formatNumberWithCommas(rep.rater_contribution)}
          </span>
        </>
      )}
    </>
  );

  const baseClasses = `group tw-inline-flex tw-items-center ${gapClass} tw-rounded-lg tw-border tw-border-solid tw-border-iron-700/60 tw-bg-iron-900/60 ${paddingClass}`;

  if (canEdit) {
    return (
      <button
        type="button"
        onClick={() => onEdit(rep.category)}
        className={`${baseClasses} tw-cursor-pointer tw-transition-colors hover:tw-border-iron-600/60 hover:tw-bg-iron-800/60`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} tw-cursor-default tw-transition-colors`}>
      {content}
    </div>
  );
}
