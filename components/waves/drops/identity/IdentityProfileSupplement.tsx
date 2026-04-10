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
  const bio = normalizeBio(profile.bio);
  const repCategories = getRepCategories(profile.top_rep_categories);
  const visibleRepCategories =
    maxRepCategories === undefined
      ? repCategories
      : repCategories.slice(0, maxRepCategories);

  if (!bio && visibleRepCategories.length === 0) {
    return null;
  }

  return (
    <div>
      {bio && (
        <p
          className={`tw-mb-3 tw-line-clamp-2 tw-whitespace-pre-line tw-break-words tw-leading-relaxed tw-text-iron-300 ${
            variant === "default"
              ? "tw-text-sm tw-font-medium tw-leading-6"
              : "tw-text-[13px] tw-font-medium tw-leading-5"
          }`}
        >
          {bio}
        </p>
      )}

      {visibleRepCategories.length > 0 && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5">
          {visibleRepCategories.map((category) => (
            <span
              key={`${category.category}-${category.rep}`}
              className="tw-inline-flex tw-items-center tw-gap-x-1 tw-rounded-lg tw-bg-black/50 tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-text-iron-200 tw-shadow-inner"
            >
              <span> {category.category}</span>
              <span className="tw-text-iron-400">
                {formatSignedRep(category.rep)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
