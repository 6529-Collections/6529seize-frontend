import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import Image from "next/image";
import Link from "next/link";

interface WaveRatingRepProps {
  readonly wave: ApiWave;
}

export default function WaveRatingRep({ wave }: WaveRatingRepProps) {
  const category = wave.voting.credit_category;
  const creditor = wave.voting.creditor;

  const hasCategory = !!category;
  const hasCreditor = !!creditor;

  if (!hasCategory && !hasCreditor) {
    return null;
  }

  const creditorInitial =
    creditor?.handle?.charAt(0).toUpperCase() ??
    creditor?.pfp?.charAt(0).toUpperCase() ??
    "?";

  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-2">
      {hasCategory && (
        <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-bg-iron-900 tw-px-3 tw-py-2">
          <span className="tw-font-medium tw-text-iron-400">Category</span>
          <span className="tw-break-all tw-text-right tw-font-semibold tw-text-iron-50">
            {category}
          </span>
        </div>
      )}

      {hasCreditor && (
        <div
          className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-bg-iron-900 tw-px-3 tw-py-2"
          aria-label={`Creditor ${creditor.handle ?? "unknown"}`}
        >
          <span className="tw-font-medium tw-text-iron-400">Creditor</span>
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            {creditor.pfp ? (
              <Image
                className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-object-cover"
                src={getScaledImageUri(creditor.pfp, ImageScale.W_AUTO_H_50)}
                alt={creditor.handle ?? ""}
                width={24}
                height={24}
              />
            ) : (
              <div className="tw-flex tw-h-6 tw-w-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-800 tw-text-xs tw-font-semibold tw-text-iron-200">
                {creditorInitial}
              </div>
            )}
            {creditor.handle ? (
              <Link
                href={`/${creditor.handle}`}
                className="tw-truncate tw-font-semibold tw-text-iron-50 tw-no-underline tw-transition-colors hover:tw-text-iron-200"
              >
                <UserProfileTooltipWrapper user={creditor.handle}>
                  <span className="tw-truncate">{creditor.handle}</span>
                </UserProfileTooltipWrapper>
              </Link>
            ) : (
              <span className="tw-font-semibold tw-text-iron-200">Unknown</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
