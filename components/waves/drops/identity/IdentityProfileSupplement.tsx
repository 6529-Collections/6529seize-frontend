import type { ApiProfileRepCategorySummary } from "@/generated/models/ApiProfileRepCategorySummary";
import { formatNumberWithCommas } from "@/helpers/Helpers";

type IdentityProfileSupplementProfile = {
  readonly bio?: string | null | undefined;
  readonly top_rep_categories?:
    | readonly ApiProfileRepCategorySummary[]
    | null
    | undefined;
};

type IdentityProfileSupplementVariant = "default" | "chat" | "compact";

interface IdentityProfileSupplementProps {
  readonly profile: IdentityProfileSupplementProfile;
  readonly variant: IdentityProfileSupplementVariant;
  readonly maxRepCategories?: number | undefined;
}

const normalizeBio = (bio: string | null | undefined): string | null => {
  const trimmedBio = bio?.trim();
  return trimmedBio && trimmedBio.length > 0 ? trimmedBio : null;
};

const getRepCategories = (
  categories: readonly ApiProfileRepCategorySummary[] | null | undefined
): ApiProfileRepCategorySummary[] =>
  (categories ?? []).filter((category) => category.category.trim().length > 0);

const formatSignedRep = (rep: number): string => {
  const formattedValue = formatNumberWithCommas(Math.abs(rep));

  if (rep > 0) {
    return `+${formattedValue}`;
  }

  if (rep < 0) {
    return `-${formattedValue}`;
  }

  return formattedValue;
};

export default function IdentityProfileSupplement({
  profile,
  variant,
  maxRepCategories,
}: IdentityProfileSupplementProps) {
  const isDefault = variant === "default";
  const isCompact = variant === "compact";
  const bio = normalizeBio(profile.bio);
  const repCategories = getRepCategories(profile.top_rep_categories);
  let bioClampClassName = "tw-line-clamp-2";
  if (isCompact) {
    bioClampClassName = "tw-line-clamp-1";
  }
  const bioTextClassName = isDefault
    ? "tw-text-sm tw-font-medium tw-leading-6"
    : "tw-text-xs tw-font-medium tw-leading-5";
  let overflowTagClassName =
    "tw-border-white/5 tw-bg-iron-900 tw-shadow-inner tw-px-2 tw-text-iron-400";
  if (isCompact) {
    overflowTagClassName =
      "tw-border-white/5 tw-bg-iron-900/40 tw-px-2 tw-text-iron-500";
  }
  const visibleRepCategories =
    maxRepCategories === undefined
      ? repCategories
      : repCategories.slice(0, maxRepCategories);
  const hiddenRepCategoryCount =
    repCategories.length - visibleRepCategories.length;

  if (!bio && visibleRepCategories.length === 0) {
    return null;
  }

  return (
    <div className={isDefault ? "tw-space-y-3" : "tw-space-y-2"}>
      {bio && (
        <p
          className={`tw-mb-0 tw-whitespace-pre-line tw-break-words tw-leading-relaxed tw-text-iron-300 ${bioTextClassName} ${bioClampClassName}`}
        >
          {bio}
        </p>
      )}

      {visibleRepCategories.length > 0 && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5">
          {visibleRepCategories.map((category) => (
            <span
              key={`${category.category}-${category.rep}`}
              className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-white/5 tw-bg-iron-900 tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-uppercase tw-leading-none tw-tracking-wide tw-text-iron-400 tw-shadow-inner"
            >
              {category.category} {formatSignedRep(category.rep)}
            </span>
          ))}

          {hiddenRepCategoryCount > 0 && (
            <span
              className={`tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-py-1 tw-text-xs tw-font-semibold tw-uppercase tw-leading-none tw-tracking-wide ${overflowTagClassName}`}
            >
              +{hiddenRepCategoryCount} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
