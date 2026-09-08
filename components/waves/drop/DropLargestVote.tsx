"use client";

import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDropVoter } from "@/generated/models/ApiDropVoter";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { isLocalVotePreviewEnabled } from "@/services/api/drop-vote-preview-api";
import Link from "next/link";
import LocalDropLargestVote from "./LocalDropLargestVote";

interface DropLargestVoteProps {
  readonly drop: ExtendedDrop;
  readonly className?: string | undefined;
}

export default function DropLargestVote({
  drop,
  className = "",
}: DropLargestVoteProps) {
  if (drop.drop_type !== ApiDropType.Participatory) {
    return null;
  }

  const largestVote = drop.submission_context?.voting.largest_vote;
  if (largestVote) {
    return (
      <LargestVoteContent
        drop={drop}
        largestVote={largestVote}
        className={className}
      />
    );
  }

  if (!isLocalVotePreviewEnabled()) {
    return null;
  }

  return (
    <LocalDropLargestVote drop={drop} className={className}>
      {(previewVote) => (
        <LargestVoteContent drop={drop} largestVote={previewVote} />
      )}
    </LocalDropLargestVote>
  );
}

function LargestVoteContent({
  drop,
  largestVote,
  className = "",
}: DropLargestVoteProps & { readonly largestVote: ApiDropVoter }) {
  const locale = useBrowserLocale();

  if (!Number.isSafeInteger(largestVote.vote) || largestVote.vote === 0) {
    return null;
  }

  const { voter, vote } = largestVote;
  const address = voter.primary_address.trim();
  const fallbackIdentity =
    address && address !== "UNKNOWN" ? address : voter.id;
  const handle = voter.handle?.trim();
  const name =
    handle === undefined || handle.length === 0 ? fallbackIdentity : handle;
  const unit = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const compactVote = formatNumber(locale, vote, {
    notation: "compact",
    maximumFractionDigits: 1,
    signDisplay: "always",
  });
  const exactVote = formatNumber(locale, vote, {
    maximumFractionDigits: 0,
    signDisplay: "always",
  });
  const accessibleLabel = t(locale, "waves.voteInsights.largestVoteByName", {
    name,
    vote: exactVote,
    unit,
  });
  const voteColor = vote > 0 ? "tw-text-emerald-400" : "tw-text-rose-400";

  return (
    <div
      className={`tw-flex tw-min-w-0 tw-items-center tw-gap-x-1.5 tw-text-xs tw-leading-5 ${className}`}
    >
      <span aria-hidden="true" className="tw-shrink-0 tw-text-iron-400">
        {t(locale, "waves.voteInsights.largestVote")}
      </span>
      <Link
        href={`/${encodeURIComponent(name)}`}
        prefetch={false}
        onClick={(event) => event.stopPropagation()}
        aria-label={accessibleLabel}
        title={accessibleLabel}
        className="tw-flex tw-min-h-6 tw-min-w-6 tw-max-w-40 tw-items-center tw-rounded-md tw-text-iron-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-100 desktop-hover:hover:tw-underline"
      >
        <span className="tw-truncate">{name}</span>
      </Link>
      <span
        aria-hidden="true"
        className={`tw-shrink-0 tw-whitespace-nowrap tw-font-medium tw-tabular-nums ${voteColor}`}
      >
        {compactVote}
      </span>
    </div>
  );
}
