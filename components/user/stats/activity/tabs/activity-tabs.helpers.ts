import { USER_PAGE_ACTIVITY_TAB } from "../activity.types";

export const USER_PAGE_ACTIVITY_TABS = Object.values(USER_PAGE_ACTIVITY_TAB);

const toActivityTabSlug = (tab: USER_PAGE_ACTIVITY_TAB) =>
  tab.toLowerCase().replaceAll("_", "-");

export const getActivityTabId = (tab: USER_PAGE_ACTIVITY_TAB) =>
  `user-collected-activity-tab-${toActivityTabSlug(tab)}`;

export const getActivityPanelId = (tab: USER_PAGE_ACTIVITY_TAB) =>
  `user-collected-activity-panel-${toActivityTabSlug(tab)}`;

export const getNextActivityTab = (
  tab: USER_PAGE_ACTIVITY_TAB,
  offset: number
) => {
  const currentIndex = USER_PAGE_ACTIVITY_TABS.indexOf(tab);
  const nextIndex =
    (currentIndex + offset + USER_PAGE_ACTIVITY_TABS.length) %
    USER_PAGE_ACTIVITY_TABS.length;

  return USER_PAGE_ACTIVITY_TABS[nextIndex];
};
