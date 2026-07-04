import type { MessageKey } from "@/i18n/messages";

type ToolsContentsGroupId =
  | "nft-delegation"
  | "the-memes-tools"
  | "builder-tools"
  | "open-data";

type ToolsNavItemVisibility = "app-wallets" | "subscriptions";

type ToolsContentsNavItem = {
  readonly id: string;
  readonly href: string;
  readonly labelKey: MessageKey;
  readonly menuHref?: string | undefined;
  readonly visibility?: ToolsNavItemVisibility | undefined;
};

type ToolsContentsNavGroup = {
  readonly id: ToolsContentsGroupId;
  readonly labelKey: MessageKey;
  readonly items: readonly ToolsContentsNavItem[];
};

type ToolsVisibilityOptions = {
  readonly appWalletsSupported: boolean;
  readonly hideSubscriptions: boolean;
};

const TOOLS_CONTENTS_NAV_GROUPS = [
  {
    id: "nft-delegation",
    labelKey: "tools.contents.groups.nftDelegation",
    items: [
      {
        id: "delegation-center",
        href: "/delegation/delegation-center",
        labelKey: "tools.contents.pages.delegationCenter",
      },
      {
        id: "wallet-architecture",
        href: "/delegation/wallet-architecture",
        labelKey: "tools.contents.pages.walletArchitecture",
      },
      {
        id: "delegation-faq",
        href: "/delegation/delegation-faq",
        labelKey: "tools.contents.pages.delegationFaq",
      },
      {
        id: "consolidation-use-cases",
        href: "/delegation/consolidation-use-cases",
        labelKey: "tools.contents.pages.consolidationUseCases",
      },
      {
        id: "wallet-checker",
        href: "/delegation/wallet-checker",
        labelKey: "tools.contents.pages.walletChecker",
      },
    ],
  },
  {
    id: "the-memes-tools",
    labelKey: "tools.contents.groups.theMemesTools",
    items: [
      {
        id: "subscriptions-report",
        href: "/tools/subscriptions-report",
        labelKey: "tools.contents.pages.subscriptionsReport",
        visibility: "subscriptions",
      },
      {
        id: "meme-accounting",
        href: "/meme-accounting",
        menuHref: "/meme-accounting?focus=the-memes",
        labelKey: "tools.contents.pages.memeAccounting",
      },
      {
        id: "meme-gas",
        href: "/meme-gas",
        menuHref: "/meme-gas?focus=the-memes",
        labelKey: "tools.contents.pages.memeGas",
      },
    ],
  },
  {
    id: "builder-tools",
    labelKey: "tools.contents.groups.builderTools",
    items: [
      {
        id: "app-wallets",
        href: "/tools/app-wallets",
        labelKey: "tools.contents.pages.appWallets",
        visibility: "app-wallets",
      },
      {
        id: "api",
        href: "/tools/api",
        labelKey: "tools.contents.pages.api",
      },
      {
        id: "emma",
        href: "/emma",
        labelKey: "tools.contents.pages.emma",
      },
      {
        id: "block-finder",
        href: "/tools/block-finder",
        labelKey: "tools.contents.pages.blockFinder",
      },
    ],
  },
  {
    id: "open-data",
    labelKey: "tools.contents.groups.openData",
    items: [
      {
        id: "open-data-hub",
        href: "/open-data",
        labelKey: "tools.contents.pages.openData",
      },
      {
        id: "network-metrics",
        href: "/open-data/network-metrics",
        labelKey: "tools.contents.pages.networkMetrics",
      },
      {
        id: "meme-subscriptions",
        href: "/open-data/meme-subscriptions",
        labelKey: "tools.contents.pages.memeSubscriptions",
        visibility: "subscriptions",
      },
      {
        id: "6529bot-usage",
        href: "/open-data/6529bot",
        labelKey: "tools.contents.pages.6529botUsage",
      },
      {
        id: "rememes",
        href: "/open-data/rememes",
        labelKey: "tools.contents.pages.rememes",
      },
      {
        id: "team",
        href: "/open-data/team",
        labelKey: "tools.contents.pages.team",
      },
      {
        id: "royalties",
        href: "/open-data/royalties",
        labelKey: "tools.contents.pages.royalties",
      },
    ],
  },
] as const satisfies readonly ToolsContentsNavGroup[];

export type ToolsNavItemId =
  (typeof TOOLS_CONTENTS_NAV_GROUPS)[number]["items"][number]["id"];

function isToolsNavItemVisible(
  item: ToolsContentsNavItem,
  options: ToolsVisibilityOptions
): boolean {
  if (item.visibility === "app-wallets") {
    return options.appWalletsSupported;
  }

  if (item.visibility === "subscriptions") {
    return !options.hideSubscriptions;
  }

  return true;
}

export function getVisibleToolsNavGroups(options: ToolsVisibilityOptions) {
  return TOOLS_CONTENTS_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isToolsNavItemVisible(item, options)),
  })).filter((group) => group.items.length > 0);
}

export function getToolsNavItemId(item: {
  readonly id: ToolsNavItemId;
}): ToolsNavItemId {
  return item.id;
}
