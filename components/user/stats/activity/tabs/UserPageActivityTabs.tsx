import type { KeyboardEvent } from "react";
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
      role="tablist"
      aria-label={t(locale, "user.collected.stats.activityTabs.listLabel")}
      className="tw-flex tw-w-full tw-overflow-hidden tw-rounded-lg sm:tw-inline-flex sm:tw-w-auto"
    >
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
  );
}
