"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

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

  let title = drop.title?.trim();
  if (!title) {
    title = t(locale, "waves.proposalCard.untitledProposal");
  }

  return (
    <button
      type="button"
      data-testid={`proposal-card-read-full-${drop.id}`}
      aria-label={t(locale, "waves.proposalCard.readFullNamed", { title })}
      onClick={(event) => {
        event.stopPropagation();
        onReadFull(drop);
      }}
      className="tw-inline-flex tw-min-h-9 tw-w-fit tw-items-center tw-self-start tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary-400 tw-underline-offset-2 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-300 desktop-hover:hover:tw-underline"
    >
      {t(locale, "waves.proposalCard.readFull")}
    </button>
  );
}
