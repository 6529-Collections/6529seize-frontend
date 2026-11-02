"use client";

import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { CompactMenu } from "@/components/compact-menu";
import CompactMenuMobileBottomSheet from "@/components/compact-menu/CompactMenuMobileBottomSheet";
import {
  COMPACT_ACTION_BUTTON_CLASS,
  COMPACT_ACTION_CONTENT_CLASS,
} from "@/components/utils/button/compactActionButtonStyles";
import { ApiCompetitionMyVotesSort } from "@/generated/models/ApiCompetitionMyVotesSort";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
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
  const { isCapacitor } = useCapacitor();
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

  const isMobile = isCapacitor || isMobileViewport;
  const title = t(locale, "waves.myVotes.sort");
  const ariaLabel = `${title}: ${labels[sort]}`;
  const triggerClassName = `${COMPACT_ACTION_BUTTON_CLASS} tw-max-w-full ${isMobile ? "tw-min-h-11" : "tw-h-8"}`;
  const trigger = (
    <span
      className={`${COMPACT_ACTION_CONTENT_CLASS} tw-min-w-0 tw-max-w-full`}
    >
      <span className="tw-truncate">{labels[sort]}</span>
      <ChevronDownIcon
        aria-hidden="true"
        className="tw-h-3.5 tw-w-3.5 tw-shrink-0"
      />
    </span>
  );
  const items = Object.values(ApiCompetitionMyVotesSort).map((value) => ({
    id: value,
    label: labels[value],
    icon: (
      <CheckIcon
        aria-hidden="true"
        className={`tw-h-4 tw-w-4 tw-shrink-0 ${value === sort ? "" : "tw-invisible"}`}
      />
    ),
    onSelect: () => onChange(value),
  }));

  if (isMobile) {
    return (
      <CompactMenuMobileBottomSheet
        title={title}
        ariaLabel={ariaLabel}
        trigger={trigger}
        triggerClassName={triggerClassName}
        items={items}
        disabled={disabled}
      />
    );
  }

  return (
    <CompactMenu
      aria-label={ariaLabel}
      className="tw-min-w-0 tw-max-w-full"
      unstyledTrigger
      triggerClassName={triggerClassName}
      trigger={trigger}
      disabled={disabled}
      anchor="bottom start"
      menuWidthClassName="tw-w-56 tw-max-w-[calc(100vw-2rem)]"
      autoFocusItem={false}
      activeItemId={sort}
      items={items}
    />
  );
}
