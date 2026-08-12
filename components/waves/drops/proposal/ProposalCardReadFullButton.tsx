"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getProposalCardViewModel } from "@/helpers/waves/proposal-card.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface ProposalCardReadFullButtonProps {
  readonly drop: ExtendedDrop;
  readonly onReadFull?: ((drop: ExtendedDrop) => void) | undefined;
}

export default function ProposalCardReadFullButton({
  drop,
  onReadFull,
}: ProposalCardReadFullButtonProps) {
  const locale = useBrowserLocale();

  if (!onReadFull) {
    return null;
  }

  const title =
    getProposalCardViewModel(drop).title ??
    t(locale, "waves.proposalCard.untitledProposal");

  return (
    <button
      type="button"
      data-testid={`proposal-card-read-full-${drop.id}`}
      aria-label={t(locale, "waves.proposalCard.readFullNamed", { title })}
      onClick={(event) => {
        event.stopPropagation();
        onReadFull(drop);
      }}
      className="tw-inline-flex tw-min-h-6 tw-w-fit tw-items-center tw-gap-0.5 tw-self-start tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-leading-5 tw-text-primary-400 tw-underline-offset-2 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-300 desktop-hover:hover:tw-underline"
    >
      {t(locale, "waves.proposalCard.readFull")}
      <ChevronRightIcon aria-hidden="true" className="tw-size-3.5" />
    </button>
  );
}
