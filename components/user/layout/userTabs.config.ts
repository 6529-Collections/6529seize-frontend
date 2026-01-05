export type UserPageVisibilityContext = {
  readonly showWaves: boolean;
  readonly hideSubscriptions: boolean;
};

type UserPageTabDefinition = {
  readonly id: string;
  readonly title: string;
  readonly route: string;
  readonly metaLabel?: string | undefined;
  readonly badge?: string | undefined;
  readonly isVisible?:
    | ((context: UserPageVisibilityContext) => boolean)
    | undefined
    | undefined;
};

const TAB_DEFINITIONS = [
  {
    id: "brain",
    title: "Brain",
    route: "",
    isVisible: ({ showWaves }: UserPageVisibilityContext) => showWaves,
  },
  {
    id: "rep",
    title: "Rep",
    route: "rep",
  },
  {
    id: "identity",
    title: "Identity",
    route: "identity",
  },
  {
    id: "collected",
    title: "Collected",
    route: "collected",
  },
  {
    id: "xtdh",
    title: "xTDH",
    route: "xtdh",
    badge: "Beta",
  },
  {
    id: "stats",
    title: "Stats",
    route: "stats",
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    route: "subscriptions",
    isVisible: ({ hideSubscriptions }: UserPageVisibilityContext) =>
      !hideSubscriptions,
  },
  {
    id: "proxy",
    title: "Proxy",
    route: "proxy",
  },
  {
    id: "groups",
    title: "Groups",
    route: "groups",
  },
  {
    id: "waves",
    title: "Waves",
    route: "waves",
    isVisible: ({ showWaves }: UserPageVisibilityContext) => showWaves,
  },
  {
    id: "followers",
    title: "Followers",
    route: "followers",
  },
] as const satisfies readonly UserPageTabDefinition[];

const USER_PAGE_TAB_DEFINITIONS: readonly UserPageTabDefinition[] =
  TAB_DEFINITIONS;

export type UserPageTabKey = (typeof TAB_DEFINITIONS)[number]["id"];

export type UserPageTabConfig = Omit<
  UserPageTabDefinition,
  "id" | "metaLabel"
> & {
  readonly id: UserPageTabKey;
  readonly metaLabel: string;
};

export const USER_PAGE_TABS = USER_PAGE_TAB_DEFINITIONS.map((tab) => ({
  ...tab,
  metaLabel: tab.metaLabel ?? tab.title,
})) as readonly UserPageTabConfig[];

export const USER_PAGE_TAB_MAP: Record<UserPageTabKey, UserPageTabConfig> =
  USER_PAGE_TABS.reduce((acc, tab) => {
    acc[tab.id] = tab;
    return acc;
  }, {} as Record<UserPageTabKey, UserPageTabConfig>);

export const USER_PAGE_TAB_IDS = USER_PAGE_TABS.reduce((acc, tab) => {
  acc[tab.id.toUpperCase() as Uppercase<UserPageTabKey>] = tab.id;
  return acc;
}, {} as { [K in Uppercase<UserPageTabKey>]: UserPageTabKey });

export const DEFAULT_USER_PAGE_TAB: UserPageTabKey = "collected";

export function getUserPageTabByRoute(route: string) {
  return USER_PAGE_TABS.find(
    (tab) => tab.route.toLowerCase() === route.toLowerCase()
  );
}

export function getUserPageTabById(id: UserPageTabKey) {
  return USER_PAGE_TAB_MAP[id];
}
