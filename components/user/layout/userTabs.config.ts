export type UserPageVisibilityContext = {
  readonly showWaves: boolean;
  readonly hideSubscriptions: boolean;
};

export type UserPageTabConfig = {
  readonly id: string;
  readonly title: string;
  readonly route: string;
  readonly metaLabel: string;
  readonly isVisible?: (context: UserPageVisibilityContext) => boolean;
};

const TABS = [
  {
    id: "brain",
    title: "Brain",
    route: "",
    metaLabel: "Brain",
    isVisible: ({ showWaves }: UserPageVisibilityContext) => showWaves,
  },
  {
    id: "rep",
    title: "Rep",
    route: "rep",
    metaLabel: "Rep",
  },
  {
    id: "identity",
    title: "Identity",
    route: "identity",
    metaLabel: "Identity",
  },
  {
    id: "collected",
    title: "Collected",
    route: "collected",
    metaLabel: "Collected",
  },
  {
    id: "stats",
    title: "Stats",
    route: "stats",
    metaLabel: "Stats",
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    route: "subscriptions",
    metaLabel: "Subscriptions",
    isVisible: ({ hideSubscriptions }: UserPageVisibilityContext) =>
      !hideSubscriptions,
  },
  {
    id: "proxy",
    title: "Proxy",
    route: "proxy",
    metaLabel: "Proxy",
  },
  {
    id: "groups",
    title: "Groups",
    route: "groups",
    metaLabel: "Groups",
  },
  {
    id: "waves",
    title: "Waves",
    route: "waves",
    metaLabel: "Waves",
    isVisible: ({ showWaves }: UserPageVisibilityContext) => showWaves,
  },
  {
    id: "followers",
    title: "Followers",
    route: "followers",
    metaLabel: "Followers",
  },
] as const satisfies readonly UserPageTabConfig[];

export type UserPageTabKey = (typeof TABS)[number]["id"];
export type UserPageTabType = UserPageTabKey;

export const USER_PAGE_TABS = TABS;

export const USER_PAGE_TAB_MAP: Record<UserPageTabKey, UserPageTabConfig> =
  USER_PAGE_TABS.reduce(
    (acc, tab) => {
      acc[tab.id] = tab;
      return acc;
    },
    {} as Record<UserPageTabKey, UserPageTabConfig>
  );

export const USER_PAGE_TAB_IDS = USER_PAGE_TABS.reduce(
  (acc, tab) => {
    acc[tab.id.toUpperCase() as Uppercase<UserPageTabKey>] = tab.id;
    return acc;
  },
  {} as { [K in Uppercase<UserPageTabKey>]: UserPageTabKey }
);

export const DEFAULT_USER_PAGE_TAB: UserPageTabKey = "collected";

export function getUserPageTabByRoute(route: string) {
  return USER_PAGE_TABS.find(
    (tab) => tab.route.toLowerCase() === route.toLowerCase()
  );
}

export function getUserPageTabById(id: UserPageTabKey) {
  return USER_PAGE_TAB_MAP[id];
}
