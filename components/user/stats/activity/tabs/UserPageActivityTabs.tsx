import { useEffect, useRef, type KeyboardEvent } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
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
  const tablistRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tablist = tablistRef.current;
    if (!tablist) {
      return;
    }

    const revealSelectedTab = () => {
      const selectedTab = tablist.querySelector<HTMLButtonElement>(
        '[aria-selected="true"]'
      );
      if (!selectedTab) {
        return;
      }

      const left = selectedTab.offsetLeft;
      const right = left + selectedTab.offsetWidth;
      if (left < tablist.scrollLeft) {
        tablist.scrollTo({ left });
      } else if (right > tablist.scrollLeft + tablist.clientWidth) {
        tablist.scrollTo({ left: right - tablist.clientWidth });
      }
    };

    revealSelectedTab();
    globalThis.addEventListener("resize", revealSelectedTab);
    return () => globalThis.removeEventListener("resize", revealSelectedTab);
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
      className="tw-no-scrollbar tw-relative tw-flex tw-w-full tw-max-w-full tw-flex-nowrap tw-overflow-x-auto tw-overflow-y-hidden tw-overscroll-x-contain tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.02] tw-p-1 sm:tw-inline-flex sm:tw-w-auto"
    >
      <div className="tw-grid tw-min-w-max tw-flex-1 tw-auto-cols-fr tw-grid-flow-col sm:tw-flex">
        {USER_PAGE_ACTIVITY_TABS.map((tab) => (
          <UserPageActivityTab
            key={tab}
            tab={tab}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            locale={locale}
            onKeyDown={(event) => selectTabFromKeyboard(event, tab)}
          />
        ))}
      </div>
    </div>
  );
}
