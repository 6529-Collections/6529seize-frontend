"use client";

import { FallbackImage } from "@/components/common/FallbackImage";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import {
  DEFAULT_PROPOSAL_CARD_RECIPE,
  getProposalCardViewModel,
} from "@/helpers/waves/proposal-card.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWaveProposalCardRecipe } from "@/hooks/waves/useWaveProposalCardRecipe";
import { t } from "@/i18n/messages";
import { useMemo } from "react";

interface ProposalCardContentProps {
  readonly drop: Pick<
    ApiDrop,
    "id" | "title" | "parts" | "parts_count" | "nft_links"
  > & {
    readonly wave?: Pick<ApiDrop["wave"], "id"> | undefined;
  };
  readonly density?: "default" | "compact" | undefined;
}

const getCountLabel = ({
  count,
  one,
  other,
  locale,
}: {
  readonly count: number;
  readonly one:
    | "waves.proposalCard.part.one"
    | "waves.proposalCard.media.one"
    | "waves.proposalCard.attachment.one";
  readonly other:
    | "waves.proposalCard.part.other"
    | "waves.proposalCard.media.other"
    | "waves.proposalCard.attachment.other";
  readonly locale: ReturnType<typeof useBrowserLocale>;
}): string => t(locale, count === 1 ? one : other, { count });

export default function ProposalCardContent({
  drop,
  density = "default",
}: ProposalCardContentProps) {
  const locale = useBrowserLocale();
  const recipe = useWaveProposalCardRecipe(drop.wave?.id);
  const viewModel = useMemo(
    () =>
      getProposalCardViewModel(drop, recipe ?? DEFAULT_PROPOSAL_CARD_RECIPE),
    [drop, recipe]
  );
  const title =
    viewModel.title ?? t(locale, "waves.proposalCard.untitledProposal");
  const isCompact = density === "compact";
  const contextLabels = [
    viewModel.partCount > 1
      ? getCountLabel({
          count: viewModel.partCount,
          one: "waves.proposalCard.part.one",
          other: "waves.proposalCard.part.other",
          locale,
        })
      : null,
    viewModel.mediaCount > 0
      ? getCountLabel({
          count: viewModel.mediaCount,
          one: "waves.proposalCard.media.one",
          other: "waves.proposalCard.media.other",
          locale,
        })
      : null,
    viewModel.attachmentCount > 0
      ? getCountLabel({
          count: viewModel.attachmentCount,
          one: "waves.proposalCard.attachment.one",
          other: "waves.proposalCard.attachment.other",
          locale,
        })
      : null,
  ].filter((label): label is string => label !== null);

  return (
    <div
      data-testid={`proposal-card-content-${drop.id}`}
      className={`tw-w-full ${isCompact ? "tw-py-0.5" : "tw-py-1"}`}
    >
      <div
        className={`tw-flex tw-min-w-0 tw-items-start ${
          isCompact ? "tw-gap-3" : "tw-gap-4"
        }`}
      >
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
          <h3
            className={`tw-[overflow-wrap:anywhere] tw-m-0 tw-line-clamp-2 tw-break-words tw-font-semibold tw-leading-snug tw-text-iron-50 tw-transition-colors tw-duration-200 desktop-hover:group-hover:tw-text-primary-300 ${
              isCompact ? "tw-text-sm" : "tw-text-base sm:tw-text-lg"
            }`}
          >
            {title}
          </h3>
          {viewModel.excerpt ? (
            <p
              className={`tw-[overflow-wrap:anywhere] tw-mb-0 tw-break-words tw-leading-relaxed tw-text-iron-300 ${
                isCompact
                  ? "tw-mt-1 tw-line-clamp-2 tw-text-xs"
                  : "tw-mt-1.5 tw-line-clamp-3 tw-text-sm"
              }`}
            >
              {viewModel.excerpt}
            </p>
          ) : null}
          {contextLabels.length > 0 ? (
            <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-[11px] tw-font-medium tw-text-iron-500">
              {contextLabels.map((label, index) => (
                <span key={label} className="tw-inline-flex tw-items-center">
                  {index > 0 ? (
                    <span className="tw-mr-2 tw-size-1 tw-rounded-full tw-bg-iron-700" />
                  ) : null}
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {viewModel.previewImage ? (
          <div
            className={`tw-relative tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-700 ${
              isCompact ? "tw-size-20" : "tw-size-24"
            }`}
          >
            <FallbackImage
              primarySrc={getScaledImageUri(
                viewModel.previewImage.url,
                ImageScale.AUTOx450
              )}
              fallbackSrc={viewModel.previewImage.url}
              alt={t(locale, "waves.proposalCard.previewAlt", { title })}
              fill
              sizes={isCompact ? "80px" : "96px"}
              className="tw-object-cover"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
