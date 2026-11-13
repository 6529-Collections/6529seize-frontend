"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { CompactMenu } from "@/components/compact-menu";
import CompactMenuMobileBottomSheet from "@/components/compact-menu/CompactMenuMobileBottomSheet";
import { COMPACT_ACTION_BUTTON_CLASS } from "@/components/utils/button/compactActionButtonStyles";
import {
  DROPDOWN_FIELD_CLASSES,
  DROPDOWN_CHEVRON_CLASSES,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";
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
      className={`${DROPDOWN_FIELD_CLASSES} tw-inline-flex tw-h-8 tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2 tw-whitespace-nowrap tw-px-3 tw-text-xs group-focus-visible:tw-outline group-focus-visible:tw-outline-2 group-focus-visible:tw-outline-offset-2 group-focus-visible:tw-outline-primary-400 desktop-hover:group-hover:tw-bg-iron-800`}
    >
      <span className="tw-truncate">{labels[sort]}</span>
      <ChevronDownIcon
        aria-hidden="true"
        className={DROPDOWN_CHEVRON_CLASSES}
      />
    </span>
  );
  const items = Object.values(ApiCompetitionMyVotesSort).map((value) => ({
    id: value,
    label: (
      <span className="tw-flex tw-items-center tw-justify-between tw-gap-x-2">
        <span>{labels[value]}</span>
        {value === sort && (
          <FontAwesomeIcon
            icon={faCheck}
            aria-hidden="true"
            className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-primary-300"
          />
        )}
      </span>
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
      menuClassName="tailwind-scope"
      menuWidthClassName="tw-w-56 tw-max-w-[calc(100vw-2rem)]"
      autoFocusItem={false}
      activeItemId={sort}
      items={items}
    />
  );
}
