"use client";

import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { CompactMenu } from "@/components/compact-menu";
import {
  COMPACT_ACTION_BUTTON_CLASS,
  COMPACT_ACTION_CONTENT_CLASS,
} from "@/components/utils/button/compactActionButtonStyles";
import { ApiCompetitionMyVotesSort } from "@/generated/models/ApiCompetitionMyVotesSort";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { t } from "@/i18n/messages";

export function CompetitionMyVotesSort({
  sort,
  onChange,
  disabled,
}: {
  readonly sort: ApiCompetitionMyVotesSort;
  readonly onChange: (sort: ApiCompetitionMyVotesSort) => void;
  readonly disabled: boolean;
}) {
  const locale = useBrowserLocale();
  const { isApp } = useDeviceInfo();
  const isMobileViewport = useIsMobileLayoutViewport();
  const labels = {
    [ApiCompetitionMyVotesSort.VoteAmount]: t(
      locale,
      "waves.myVotes.sort.voteAmount"
    ),
    [ApiCompetitionMyVotesSort.Leaderboard]: t(
      locale,
      "waves.myVotes.sort.leaderboard"
    ),
    [ApiCompetitionMyVotesSort.LastVoted]: t(
      locale,
      "waves.myVotes.sort.lastVoted"
    ),
  };

  return (
    <CompactMenu
      aria-label={`${t(locale, "waves.myVotes.sort")}: ${labels[sort]}`}
      className="tw-min-w-0 tw-max-w-full"
      unstyledTrigger
      triggerClassName={`${COMPACT_ACTION_BUTTON_CLASS} tw-max-w-full ${isApp || isMobileViewport ? "tw-min-h-11" : "tw-h-8"}`}
      trigger={({ isOpen }) => (
        <span
          className={`${COMPACT_ACTION_CONTENT_CLASS} tw-min-w-0 tw-max-w-full`}
        >
          <span className="tw-truncate">{labels[sort]}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className={`tw-h-3.5 tw-w-3.5 tw-shrink-0 ${isOpen ? "tw-rotate-180" : ""}`}
          />
        </span>
      )}
      disabled={disabled}
      anchor="bottom start"
      menuWidthClassName="tw-w-56 tw-max-w-[calc(100vw-2rem)]"
      itemClassName="tw-min-h-11 tw-text-xs lg:tw-min-h-9"
      activeItemId={sort}
      items={Object.values(ApiCompetitionMyVotesSort).map((value) => ({
        id: value,
        label: labels[value],
        icon: (
          <CheckIcon
            aria-hidden="true"
            className={`tw-h-4 tw-w-4 tw-shrink-0 ${value === sort ? "" : "tw-invisible"}`}
          />
        ),
        onSelect: () => onChange(value),
      }))}
    />
  );
}
