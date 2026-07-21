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
    "tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border-0 tw-px-1.5 tw-py-2 tw-text-[11px] tw-font-semibold tw-leading-4 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 sm:tw-flex-none sm:tw-px-4 sm:tw-text-sm",
    isActive
      ? "tw-bg-white/[0.08] tw-text-iron-100"
      : "tw-bg-transparent tw-text-iron-500 hover:tw-bg-white/[0.04] hover:tw-text-iron-200",
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
