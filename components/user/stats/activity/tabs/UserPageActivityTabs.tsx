import { useEffect, useRef, type KeyboardEvent } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import clsx from "clsx";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { CONNECTED_TAB_LIST_CLASSES } from "@/components/utils/select/tabs/connectedTabStyles";
import type { USER_PAGE_ACTIVITY_TAB } from "../activity.types";
import {
  getActivityTabId,
  getNextActivityTab,
  USER_PAGE_ACTIVITY_TABS,
} from "./activity-tabs.helpers";
import UserPageActivityTab from "./UserPageActivityTab";

const focusActivityTab = (tab: USER_PAGE_ACTIVITY_TAB) => {
  if (typeof globalThis.document === "undefined") {
    return;
  }

  const focusTab = () => {
    globalThis.document.getElementById(getActivityTabId(tab))?.focus();
  };

  if (typeof globalThis.requestAnimationFrame === "function") {
    globalThis.requestAnimationFrame(focusTab);
    return;
  }

  globalThis.setTimeout(focusTab, 0);
};

export default function UserPageActivityTabs({
  activeTab,
  setActiveTab,
  locale,
}: {
  readonly activeTab: USER_PAGE_ACTIVITY_TAB;
  readonly setActiveTab: (tab: USER_PAGE_ACTIVITY_TAB) => void;
  readonly locale: SupportedLocale;
}) {
  const compact = useMediaQuery("(max-width: 767px)");
  const tablistRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tablist = tablistRef.current;
    if (!tablist) {
      return;
    }

    const revealSelectedTab = () => {
      if (tablist.clientWidth === 0) {
        return;
      }
      const selectedTab = tablist.querySelector<HTMLButtonElement>(
        '[aria-selected="true"]'
      );
      if (!selectedTab) {
        return;
      }

      // Offset metrics round fractional pill widths. Keep a pixel of clearance
      // so the selected tab's edge stays visible after scrolling.
      const left = Math.max(0, selectedTab.offsetLeft - 1);
      const right = selectedTab.offsetLeft + selectedTab.offsetWidth + 1;
      if (left < tablist.scrollLeft) {
        tablist.scrollTo({ left });
      } else if (right > tablist.scrollLeft + tablist.clientWidth) {
        tablist.scrollTo({ left: right - tablist.clientWidth });
      }
    };

    revealSelectedTab();
    // Font loading and a containing panel's layout can resize the strip
    // without a window resize. Reveal the active tab after those changes.
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(revealSelectedTab);
    observer?.observe(tablist);
    if (tablist.firstElementChild) {
      observer?.observe(tablist.firstElementChild);
    }
    globalThis.addEventListener("resize", revealSelectedTab);
    return () => {
      observer?.disconnect();
      globalThis.removeEventListener("resize", revealSelectedTab);
    };
  }, [activeTab, locale]);

  const selectTabFromKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    tab: USER_PAGE_ACTIVITY_TAB
  ) => {
    const keyToTab: Partial<Record<string, USER_PAGE_ACTIVITY_TAB>> = {
      ArrowLeft: getNextActivityTab(tab, -1),
      ArrowRight: getNextActivityTab(tab, 1),
      Home: USER_PAGE_ACTIVITY_TABS[0],
      End: USER_PAGE_ACTIVITY_TABS[USER_PAGE_ACTIVITY_TABS.length - 1],
    };
    const nextTab = keyToTab[event.key];

    if (nextTab === undefined) {
      return;
    }

    event.preventDefault();
    setActiveTab(nextTab);
    focusActivityTab(nextTab);
  };

  return (
    <div
      ref={tablistRef}
      role="tablist"
      aria-label={t(locale, "user.collected.stats.activityTabs.listLabel")}
      className={clsx(
        "tw-no-scrollbar tw-relative tw-flex tw-w-full tw-max-w-full tw-flex-nowrap tw-overflow-x-auto tw-overflow-y-hidden tw-overscroll-x-contain",
        !compact &&
          `${CONNECTED_TAB_LIST_CLASSES} sm:tw-inline-flex sm:tw-w-auto`
      )}
    >
      <div
        className={
          compact
            ? "tw-flex tw-w-max tw-flex-none tw-gap-1 tw-pr-px"
            : "tw-grid tw-min-w-max tw-flex-1 tw-auto-cols-fr tw-grid-flow-col tw-gap-0.5 sm:tw-flex"
        }
      >
        {USER_PAGE_ACTIVITY_TABS.map((tab) => (
          <UserPageActivityTab
            key={tab}
            tab={tab}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            locale={locale}
            compact={compact}
            onKeyDown={(event) => selectTabFromKeyboard(event, tab)}
          />
        ))}
      </div>
    </div>
  );
}
