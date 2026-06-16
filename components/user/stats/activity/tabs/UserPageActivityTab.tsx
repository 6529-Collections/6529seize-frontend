import type { KeyboardEventHandler } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { USER_PAGE_ACTIVITY_TAB } from "../activity.types";
import { getActivityPanelId, getActivityTabId } from "./activity-tabs.helpers";

type ActivityTabMessageKey = Extract<
  MessageKey,
  `user.collected.stats.activityTabs.${string}`
>;

const TAB_TO_LABEL_KEY: Record<USER_PAGE_ACTIVITY_TAB, ActivityTabMessageKey> =
  {
    [USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY]:
      "user.collected.stats.activityTabs.walletActivity",
    [USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS]:
      "user.collected.stats.activityTabs.distributions",
    [USER_PAGE_ACTIVITY_TAB.TDH_HISTORY]:
      "user.collected.stats.activityTabs.tdhHistory",
  };

export default function UserPageActivityTab({
  tab,
  activeTab,
  setActiveTab,
  locale,
  onKeyDown,
}: {
  readonly tab: USER_PAGE_ACTIVITY_TAB;
  readonly activeTab: USER_PAGE_ACTIVITY_TAB;
  readonly setActiveTab: (tab: USER_PAGE_ACTIVITY_TAB) => void;
  readonly locale: SupportedLocale;
  readonly onKeyDown: KeyboardEventHandler<HTMLButtonElement>;
}) {
  const isActive = tab === activeTab;
  const className = [
    "tw-border tw-border-solid tw-border-iron-700 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-transition tw-duration-300 tw-ease-out",
    isActive
      ? "tw-bg-iron-800 tw-text-iron-100"
      : "tw-bg-iron-950 tw-text-iron-500 hover:tw-bg-iron-900 hover:tw-text-iron-100",
    tab === USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY ? "tw-rounded-l-lg" : "",
    tab === USER_PAGE_ACTIVITY_TAB.TDH_HISTORY ? "tw-rounded-r-lg" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      role="tab"
      id={getActivityTabId(tab)}
      aria-selected={isActive}
      aria-controls={getActivityPanelId(tab)}
      tabIndex={isActive ? 0 : -1}
      className={className}
      onClick={() => setActiveTab(tab)}
      onKeyDown={onKeyDown}
    >
      {t(locale, TAB_TO_LABEL_KEY[tab])}
    </button>
  );
}
