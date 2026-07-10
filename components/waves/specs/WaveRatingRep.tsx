import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import Image from "next/image";
import Link from "next/link";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

interface WaveRatingRepProps {
  readonly wave: ApiWave;
}

export default function WaveRatingRep({ wave }: WaveRatingRepProps) {
  const category = wave.voting.credit_category;
  const creditor = wave.voting.creditor;

  const hasCategory = !!category;
  const hasCreditor = !!creditor;
  const unknownLabel = waveRightPanelText(
    "waves.sidebar.rightPanel.specs.unknown"
  );

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
        <div className="tw-flex tw-w-full tw-flex-col tw-items-start tw-gap-1 tw-rounded-lg tw-bg-iron-900 tw-px-3 tw-py-2.5">
          <span className="tw-text-xs tw-font-normal tw-text-iron-500">
            {waveRightPanelText("waves.sidebar.rightPanel.specs.category")}
          </span>
          <span className="tw-w-full tw-break-words tw-text-left tw-font-medium tw-leading-5 tw-text-iron-50">
            {category}
          </span>
        </div>
      )}

      {hasCreditor && (
        <div
          className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-bg-iron-900 tw-px-3 tw-py-2"
          aria-label={waveRightPanelText(
            "waves.sidebar.rightPanel.specs.creditorAriaLabel",
            { handle: creditor.handle ?? unknownLabel }
          )}
        >
          <span className="tw-font-normal tw-text-iron-500">
            {waveRightPanelText("waves.sidebar.rightPanel.specs.creditor")}
          </span>
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
              <div className="tw-flex tw-h-6 tw-w-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-800 tw-text-xs tw-font-medium tw-text-iron-50">
                {creditorInitial}
              </div>
            )}
            {creditor.handle ? (
              <Link
                href={`/${creditor.handle}`}
                className="tw-truncate tw-font-medium tw-text-iron-50 tw-no-underline tw-transition-colors hover:tw-text-iron-200"
              >
                <UserProfileTooltipWrapper user={creditor.handle}>
                  <span className="tw-truncate">{creditor.handle}</span>
                </UserProfileTooltipWrapper>
              </Link>
            ) : (
              <span className="tw-font-medium tw-text-iron-50">
                {unknownLabel}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
