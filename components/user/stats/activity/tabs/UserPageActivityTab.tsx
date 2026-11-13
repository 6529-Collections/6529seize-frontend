import type { KeyboardEventHandler } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { USER_PAGE_ACTIVITY_TAB } from "../activity.types";
import { getActivityPanelId, getActivityTabId } from "./activity-tabs.helpers";
import { getConnectedTabButtonClasses } from "@/components/utils/select/tabs/connectedTabStyles";

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
  const className = `${getConnectedTabButtonClasses({ isActive, fill: true })} sm:tw-flex-none`;

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
