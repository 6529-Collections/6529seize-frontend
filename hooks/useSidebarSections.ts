import { useMemo, type ComponentType } from "react";
import { UsersIcon, WrenchIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import Squares2X2Icon from "@/components/common/icons/Squares2X2Icon";
import { SidebarSection } from "@/components/navigation/navTypes";
import { AboutSection } from "@/enums";

export function useSidebarSections(
  appWalletsSupported: boolean,
  isIos: boolean,
  country: string | null
): SidebarSection[] {
  return useMemo<SidebarSection[]>(
    () => [
      {
        key: "network",
        name: "Network",
        icon: UsersIcon,
        items: [
          { name: "Identities", href: "/network" },
          { name: "Activity", href: "/network/activity" },
          { name: "Groups", href: "/network/groups" },
          { name: "NFT Activity", href: "/nft-activity" },
          { name: "Memes Calendar", href: "/meme-calendar" },
          { name: "TDH", href: "/network/tdh" },
        ],
        subsections: [
          {
            name: "Metrics",
            items: [
              { name: "Definitions", href: "/network/definitions" },
              { name: "Network Stats", href: "/network/stats" },
              { name: "Levels", href: "/network/levels" },
            ],
          },
        ],
      },
      {
        key: "collections",
        name: "Collections",
        icon: Squares2X2Icon,
        items: [
          { name: "The Memes", href: "/the-memes" },
          { name: "6529 Gradient", href: "/6529-gradient" },
          { name: "NextGen", href: "/nextgen" },
          { name: "Meme Lab", href: "/meme-lab" },
          { name: "ReMemes", href: "/rememes" },
        ],
        subsections: [],
      },
      {
        key: "tools",
        name: "Tools",
        icon: WrenchIcon,
        items: [],
        subsections: [
          {
            name: "NFT Delegation",
            items: [
              {
                name: "Delegation Center",
                href: "/delegation/delegation-center",
              },
              {
                name: "Wallet Architecture",
                href: "/delegation/wallet-architecture",
              },
              { name: "Delegation FAQs", href: "/delegation/delegation-faq" },
              {
                name: "Consolidation Use Cases",
                href: "/delegation/consolidation-use-cases",
              },
              { name: "Wallet Checker", href: "/delegation/wallet-checker" },
            ],
          },
          {
            name: "The Memes Tools",
            items: [
              ...(!isIos || country?.toUpperCase() === "US"
                ? [
                    {
                      name: "Memes Subscriptions",
                      href: "/tools/subscriptions-report",
                    },
                  ]
                : []),
              { name: "Memes Accounting", href: "/meme-accounting" },
              { name: "Memes Gas", href: "/meme-gas" },
            ],
          },
          {
            name: "Other Tools",
            items: [
              ...(appWalletsSupported
                ? [{ name: "App Wallets", href: "/tools/app-wallets" }]
                : []),
              { name: "API", href: "/tools/api" },
              { name: "EMMA", href: "/emma" },
              { name: "Block Finder", href: "/tools/block-finder" },
              { name: "Open Data", href: "/open-data" },
            ],
          },
        ],
      },
      {
        key: "about",
        name: "About",
        icon: DocumentTextIcon,
        items: [{ name: "GDRC1", href: `/about/${AboutSection.GDRC1}` }],
        subsections: [
          {
            name: "NFTs",
            items: [
              { name: "The Memes", href: `/about/${AboutSection.MEMES}` },
              ...(!isIos || country?.toUpperCase() === "US"
                ? [
                    {
                      name: "Subscriptions",
                      href: `/about/${AboutSection.SUBSCRIPTIONS}`,
                    },
                  ]
                : []),
              { name: "Minting", href: `/about/${AboutSection.MINTING}` },
              {
                name: "Nakamoto Threshold",
                href: `/about/${AboutSection.NAKAMOTO_THRESHOLD}`,
              },
              { name: "Meme Lab", href: `/about/${AboutSection.MEME_LAB}` },
              { name: "Gradients", href: `/about/${AboutSection.GRADIENTS}` },
            ],
          },
          {
            name: "NFT Delegation",
            items: [
              {
                name: "About NFTD",
                href: `/about/${AboutSection.NFT_DELEGATION}`,
              },
              {
                name: "Primary Address",
                href: `/about/${AboutSection.PRIMARY_ADDRESS}`,
              },
            ],
          },
          {
            name: "6529 Capital",
            items: [
              { name: "About 6529 Capital", href: `/capital` },
              { name: "Company Portfolio", href: `/capital/company-portfolio` },
              { name: "NFT Fund", href: `/capital/fund` },
            ],
          },
          {
            name: "Support",
            items: [
              { name: "FAQ", href: `/about/${AboutSection.FAQ}` },
              { name: "Apply", href: `/about/${AboutSection.APPLY}` },
              { name: "Contact Us", href: `/about/${AboutSection.CONTACT_US}` },
            ],
          },
          {
            name: "Resources",
            items: [
              {
                name: "Data Decentralization",
                href: `/about/${AboutSection.DATA_DECENTR}`,
              },
              { name: "ENS", href: `/about/${AboutSection.ENS}` },
              { name: "License", href: `/about/${AboutSection.LICENSE}` },
              {
                name: "Release Notes",
                href: `/about/${AboutSection.RELEASE_NOTES}`,
              },
            ],
          },
        ],
      },
    ],
    [appWalletsSupported, isIos, country]
  );
}

export function useSectionMap(sections: SidebarSection[]) {
  return useMemo(
    () => new Map(sections.map(section => [section.key, section])),
    [sections]
  );
}

export interface SidebarPageEntry {
  name: string;
  href: string;
  section: string;
  subsection?: string;
  icon?: ComponentType<{ className?: string }>;
}

export function mapSidebarSectionsToPages(
  sections: SidebarSection[]
): SidebarPageEntry[] {
  return sections.flatMap((section) => {
    const sectionIcon = section.icon;
    const sectionItems: SidebarPageEntry[] = section.items.map((item) => ({
      name: item.name,
      href: item.href,
      section: section.name,
      icon: sectionIcon,
    }));

    const subsectionItems =
      section.subsections?.flatMap((subsection) =>
        subsection.items.map((item) => ({
          name: item.name,
          href: item.href,
          section: section.name,
          subsection: subsection.name,
          icon: sectionIcon,
        }))
      ) ?? [];

    return [...sectionItems, ...subsectionItems];
  });
}
