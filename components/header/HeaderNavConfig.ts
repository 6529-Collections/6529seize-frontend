import { AboutSection } from "@/enums";

export interface NavLink {
  name: string;
  path: string;
  condition?: (context: NavContext) => boolean;
}

export interface NavSection {
  name: string;
  items: NavLink[];
  hasDivider?: boolean;
}

export interface NavDropdown {
  title: string;
  condition?: (context: NavContext) => boolean;
  className?: string | ((context: NavContext) => string);
  items?: NavLink[];
  sections?: NavSection[];
  hasDividerAfter?: boolean;
}

export interface NavContext {
  showWaves: boolean;
  appWalletsSupported: boolean;
  capacitorIsIos: boolean;
  country: string;
  pathname?: string;
}

export function getDesktopNavigation(_context: NavContext): NavDropdown[] {
  return [
    {
      title: "Brain",
      condition: (ctx) => ctx.showWaves,
      items: [
        { name: "My Stream", path: "/?tab=feed" },
        { name: "Waves", path: "/waves" },
      ],
    },
    {
      title: "Collections",
      items: [
        { name: "The Memes", path: "/the-memes" },
        { name: "Gradient", path: "/6529-gradient" },
        { name: "NextGen", path: "/nextgen" },
        { name: "Meme Lab", path: "/meme-lab" },
        { name: "ReMemes", path: "/rememes" },
      ],
    },
    {
      title: "Network",
      items: [
        { name: "Identities", path: "/network" },
        { name: "Activity", path: "/network/activity" },
        { name: "Groups", path: "/network/groups" },
        { name: "NFT Activity", path: "/nft-activity" },
        { name: "Memes Calendar", path: "/meme-calendar" },
        { name: "TDH", path: "/network/tdh" },
      ],
      sections: [
        {
          name: "Metrics",
          items: [
            { name: "Definitions", path: "/network/definitions" },
            { name: "Network Stats", path: "/network/stats" },
            { name: "Levels", path: "/network/levels" },
          ],
        },
      ],
    },
    {
      title: "Tools",
      items: [
        {
          name: "App Wallets",
          path: "/tools/app-wallets",
          condition: (ctx) => ctx.appWalletsSupported,
        },
      ],
      sections: [
        {
          name: "NFT Delegation",
          items: [
            {
              name: "Delegation Center",
              path: "/delegation/delegation-center",
            },
            {
              name: "Wallet Architecture",
              path: "/delegation/wallet-architecture",
            },
            { name: "Delegation FAQs", path: "/delegation/delegation-faq" },
            {
              name: "Consolidation Use Cases",
              path: "/delegation/consolidation-use-cases",
            },
            { name: "Wallet Checker", path: "/delegation/wallet-checker" },
          ],
        },
        {
          name: "The Memes Tools",
          items: [
            {
              name: "Memes Subscriptions",
              path: "/tools/subscriptions-report",
              condition: (ctx) => !ctx.capacitorIsIos || ctx.country === "US",
            },
            { name: "Memes Accounting", path: "/meme-accounting" },
            { name: "Memes Gas", path: "/meme-gas" },
          ],
        },
      ],
      hasDividerAfter: true,
    },
    {
      title: "About",
      className: (_context) =>
        _context.pathname?.includes("/about") ? "active" : "",
      items: [{ name: "GDRC1", path: `/about/${AboutSection.GDRC1}` }],
      sections: [
        {
          name: "NFTs",
          items: [
            { name: "The Memes", path: `/about/${AboutSection.MEMES}` },
            {
              name: "Subscriptions",
              path: `/about/${AboutSection.SUBSCRIPTIONS}`,
              condition: (ctx) => !ctx.capacitorIsIos || ctx.country === "US",
            },
            { name: "Minting", path: `/about/${AboutSection.MINTING}` },
            {
              name: "Nakamoto Threshold",
              path: `/about/${AboutSection.NAKAMOTO_THRESHOLD}`,
            },
            { name: "Meme Lab", path: `/about/${AboutSection.MEME_LAB}` },
            { name: "Gradient", path: `/about/${AboutSection.GRADIENTS}` },
          ],
          hasDivider: true,
        },
        {
          name: "NFT Delegation",
          items: [
            {
              name: "About NFTD",
              path: `/about/${AboutSection.NFT_DELEGATION}`,
            },
            {
              name: "Primary Address",
              path: `/about/${AboutSection.PRIMARY_ADDRESS}`,
            },
          ],
        },
        {
          name: "6529 Capital",
          items: [
            { name: "About 6529 Capital", path: `/capital` },
            { name: "Company Portfolio", path: `/capital/company-portfolio` },
            { name: "NFT Fund", path: `/capital/fund` },
          ],
        },
        {
          name: "Support",
          items: [
            { name: "FAQ", path: `/about/${AboutSection.FAQ}` },
            { name: "Apply", path: `/about/${AboutSection.APPLY}` },
            { name: "Contact Us", path: `/about/${AboutSection.CONTACT_US}` },
          ],
        },
        {
          name: "Resources",
          items: [
            {
              name: "Data Decentralization",
              path: `/about/${AboutSection.DATA_DECENTR}`,
            },
            { name: "ENS", path: `/about/${AboutSection.ENS}` },
            { name: "License", path: `/about/${AboutSection.LICENSE}` },
            {
              name: "Release Notes",
              path: `/about/${AboutSection.RELEASE_NOTES}`,
            },
          ],
        },
      ],
    },
  ];
}

export const toolsBottomItems: NavLink[] = [
  { name: "API", path: "/tools/api" },
  { name: "EMMA", path: "/emma" },
  { name: "Block Finder", path: "/tools/block-finder" },
  { name: "Open Data", path: "/open-data" },
];
