"use client";

import { AuthContext } from "@/components/auth/Auth";
import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { usePrefetchNotifications } from "@/hooks/useNotificationsQuery";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  DROP_POLL_VOTED_NOTIFICATION_CAUSE,
  type NotificationCause,
} from "@/types/feed.types";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useContext, useId, useMemo, useRef, useState } from "react";

export interface NotificationFilter {
  readonly cause: NotificationCause[];
  readonly title: string;
}

const NOTIFICATION_FILTERS: readonly NotificationFilter[] = [
  {
    cause: [
      ApiNotificationCause.IdentityMentioned,
      ApiNotificationCause.DropQuoted,
    ],
    title: "Mentions",
  },
  { cause: [ApiNotificationCause.DropReplied], title: "Replies" },
  {
    cause: [
      ApiNotificationCause.IdentitySubscribed,
      ApiNotificationCause.IdentityRep,
      ApiNotificationCause.IdentityNic,
    ],
    title: "Identity",
  },
  {
    cause: [
      ApiNotificationCause.DropVoted,
      DROP_POLL_VOTED_NOTIFICATION_CAUSE,
      ApiNotificationCause.DropReacted,
      ApiNotificationCause.DropBoosted,
    ],
    title: "Reactions",
  },
  { cause: [ApiNotificationCause.WaveCreated], title: "Invites" },
  {
    cause: [ApiNotificationCause.SubscriptionCoverage],
    title: "Subscriptions",
  },
];

function isFilterSelected(
  filter: NotificationFilter,
  activeCauses: ReadonlySet<NotificationCause>
): boolean {
  return filter.cause.every((cause) => activeCauses.has(cause));
}

function getTriggerLabel(
  selectedFilters: readonly NotificationFilter[],
  locale: SupportedLocale
) {
  if (selectedFilters.length === 0) {
    return t(locale, "profilePreferences.notifications.ALL.label");
  }
  if (selectedFilters.length === 1) {
    return selectedFilters[0]!.title;
  }
  return t(locale, "notifications.filter.selected", {
    count: selectedFilters.length,
  });
}

function FilterMenuItem({
  title,
  selected,
  onSelect,
  onMouseEnter,
}: {
  readonly title: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly onMouseEnter?: (() => void) | undefined;
}) {
  return (
    <li role="none" className="tw-list-none">
      <button
        type="button"
        role="menuitemcheckbox"
        aria-checked={selected}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onMouseEnter={onMouseEnter}
        className={`tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400 ${
          selected
            ? "tw-text-primary-400 desktop-hover:hover:tw-bg-primary-400/10"
            : "tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800"
        }`}
      >
        <span className="tw-min-w-0 tw-flex-1 tw-truncate">{title}</span>
        {selected ? (
          <CheckIcon
            className="tw-size-4 tw-flex-shrink-0"
            aria-hidden="true"
          />
        ) : (
          <span className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
        )}
      </button>
    </li>
  );
}

export default function NotificationsCauseFilter({
  activeFilter,
  setActiveFilter,
}: {
  readonly activeFilter: NotificationFilter | null;
  readonly setActiveFilter: (filter: NotificationFilter | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useBrowserLocale();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuBaseId = useId();
  const triggerId = `${menuBaseId}-trigger`;
  const menuId = `${menuBaseId}-menu`;
  const { connectedProfile } = useContext(AuthContext);
  const prefetchNotifications = usePrefetchNotifications();

  const activeCauses = useMemo(
    () => new Set<NotificationCause>(activeFilter?.cause ?? []),
    [activeFilter]
  );
  const selectedFilters = useMemo(
    () =>
      NOTIFICATION_FILTERS.filter((filter) =>
        isFilterSelected(filter, activeCauses)
      ),
    [activeCauses]
  );
  const triggerLabel = getTriggerLabel(selectedFilters, locale);

  const updateSelectedFilters = (
    nextSelectedFilters: readonly NotificationFilter[]
  ) => {
    if (nextSelectedFilters.length === 0) {
      setActiveFilter(null);
      return;
    }

    setActiveFilter({
      title: getTriggerLabel(nextSelectedFilters, locale),
      cause: nextSelectedFilters.flatMap((filter) => filter.cause),
    });
  };

  const toggleFilter = (filter: NotificationFilter) => {
    const nextSelectedFilters = isFilterSelected(filter, activeCauses)
      ? selectedFilters.filter((selected) => selected.title !== filter.title)
      : [...selectedFilters, filter];
    updateSelectedFilters(nextSelectedFilters);
  };

  const prefetchFilter = (filter: NotificationFilter) => {
    if (!connectedProfile) return;
    prefetchNotifications({
      identity: connectedProfile.handle,
      cause: filter.cause,
      pages: 1,
    });
  };

  return (
    <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-pb-2 tw-pt-2 lg:tw-pt-4">
      <h1 className="tw-m-0 tw-min-w-0 tw-truncate tw-text-xl tw-font-semibold tw-text-iron-100">
        {t(locale, "profilePreferences.notifications.heading")}
      </h1>

      <div className="tw-relative tw-w-36 tw-flex-shrink-0 sm:tw-w-56">
        <button
          id={triggerId}
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={t(locale, "notifications.filter.ariaLabel", {
            selection: triggerLabel,
          })}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls={isOpen ? menuId : undefined}
          className="tw-flex tw-h-10 tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900"
        >
          <span className="tw-min-w-0 tw-truncate">{triggerLabel}</span>
          <ChevronDownIcon
            className={`tw-size-4 tw-flex-shrink-0 tw-text-iron-400 tw-transition-transform tw-duration-200 ${
              isOpen ? "tw-rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
        <CommonDropdownItemsDefaultWrapper
          isOpen={isOpen}
          setOpen={setIsOpen}
          buttonRef={buttonRef}
          horizontalAlign="right"
          minWidth={224}
          menuId={menuId}
          menuLabelledBy={triggerId}
        >
          <FilterMenuItem
            title={t(locale, "profilePreferences.notifications.ALL.label")}
            selected={selectedFilters.length === 0}
            onSelect={() => updateSelectedFilters([])}
          />
          {NOTIFICATION_FILTERS.map((filter) => (
            <FilterMenuItem
              key={filter.title}
              title={filter.title}
              selected={isFilterSelected(filter, activeCauses)}
              onSelect={() => toggleFilter(filter)}
              onMouseEnter={() => prefetchFilter(filter)}
            />
          ))}
        </CommonDropdownItemsDefaultWrapper>
      </div>
    </div>
  );
}
