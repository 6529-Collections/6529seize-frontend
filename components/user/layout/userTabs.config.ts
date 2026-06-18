import { getUserProfileTabsMessage } from "./user-tabs.messages";

export type UserPageVisibilityContext = {
  readonly showWaves: boolean;
  readonly hasProfileWave: boolean;
  readonly hideSubscriptions: boolean;
  readonly isOwnProfile: boolean;
};

type UserPageTabDefinition = {
  readonly id: string;
  readonly titleKey: Parameters<typeof getUserProfileTabsMessage>[0];
  readonly route: string;
  readonly metaLabelKey?: Parameters<typeof getUserProfileTabsMessage>[0];
  readonly badgeKey?: Parameters<typeof getUserProfileTabsMessage>[0];
  readonly isVisible?:
    | ((context: UserPageVisibilityContext) => boolean)
    | undefined;
};

const TAB_DEFINITIONS = [
  {
    id: "rep",
    titleKey: "user.profile.tabs.identity",
    route: "",
  },
  {
    id: "brain",
    titleKey: "user.profile.tabs.brain",
    route: "brain",
    isVisible: ({ showWaves }: UserPageVisibilityContext) => showWaves,
  },
  {
    id: "waves",
    titleKey: "user.profile.tabs.curation",
    route: "curations",
  },
  {
    id: "collected",
    titleKey: "user.profile.tabs.collected",
    route: "collected",
  },
  {
    id: "xtdh",
    titleKey: "user.profile.tabs.xtdh",
    route: "xtdh",
    badgeKey: "user.profile.tabs.badges.beta",
  },
  {
    id: "subscriptions",
    titleKey: "user.profile.tabs.subscriptions",
    route: "subscriptions",
    isVisible: ({ hideSubscriptions }: UserPageVisibilityContext) =>
      !hideSubscriptions,
  },
  {
    id: "proxy",
    titleKey: "user.profile.tabs.proxy",
    route: "proxy",
    isVisible: ({ isOwnProfile }: UserPageVisibilityContext) => isOwnProfile,
  },
] as const satisfies readonly UserPageTabDefinition[];

const USER_PAGE_TAB_DEFINITIONS: readonly UserPageTabDefinition[] =
  TAB_DEFINITIONS;

export type UserPageTabKey = (typeof TAB_DEFINITIONS)[number]["id"];

export type UserPageTabConfig = Omit<
  UserPageTabDefinition,
  "id" | "titleKey" | "metaLabelKey" | "badgeKey"
> & {
  readonly id: UserPageTabKey;
  readonly title: string;
  readonly metaLabel: string;
  readonly badge?: string | undefined;
};

export const USER_PAGE_TABS = USER_PAGE_TAB_DEFINITIONS.map((tab) => ({
  ...tab,
  title: getUserProfileTabsMessage(tab.titleKey),
  metaLabel: getUserProfileTabsMessage(tab.metaLabelKey ?? tab.titleKey),
  badge: tab.badgeKey ? getUserProfileTabsMessage(tab.badgeKey) : undefined,
})) as readonly UserPageTabConfig[];

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

export const DEFAULT_USER_PAGE_TAB: UserPageTabKey = "rep";

export function getUserPageTabByRoute(route: string) {
  return USER_PAGE_TABS.find(
    (tab) => tab.route.toLowerCase() === route.toLowerCase()
  );
}

export function getUserPageTabById(id: UserPageTabKey) {
  return USER_PAGE_TAB_MAP[id];
}
