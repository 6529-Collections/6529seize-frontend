import { renderHook } from "@testing-library/react";
import { useSidebarSections } from "@/hooks/useSidebarSections";

describe("useSidebarSections", () => {
  it("returns the menu IA groups with the Museum reading room link", () => {
    const { result } = renderHook(() => useSidebarSections(false, false, "US"));

    expect(result.current.map((section) => section.key)).toEqual([
      "nfts",
      "museum",
      "waves",
      "about",
    ]);

    const nftsSection = result.current.find(
      (section) => section.key === "nfts"
    );
    expect(nftsSection?.name).toBe("NFTs");
    expect(nftsSection?.items.map((item) => item.name)).toEqual([
      "Collect",
      "The Memes",
      "6529 Gradient",
      "NextGen",
      "Meme Lab",
      "ReMemes",
      "6529 Stream",
      "NFT Activity",
      "Memes Calendar",
    ]);
    expect(nftsSection?.items[6]).toEqual({
      name: "6529 Stream",
      href: "/stream",
      activePathPrefixes: ["/stream/"],
    });

    const wavesSection = result.current.find(
      (section) => section.key === "waves"
    );
    expect(wavesSection?.items).toEqual([
      {
        name: "Waves",
        href: "/waves",
        activePathPrefixes: ["/waves/"],
      },
      { name: "Discover Waves", href: "/discover" },
    ]);

    const museumSection = result.current.find(
      (section) => section.key === "museum"
    );
    expect(museumSection?.items).toEqual([
      {
        name: "Museum",
        href: "/museum/network",
        activePathPrefixes: ["/museum/network/"],
      },
    ]);
  });

  it("does not include retired release notes links", () => {
    const { result } = renderHook(() => useSidebarSections(false, false, "US"));

    const allItems = result.current.flatMap((section) => [
      ...section.items,
      ...(section.subsections ?? []).flatMap((subsection) => subsection.items),
    ]);

    expect(allItems.some((item) => item.name === "Release Notes")).toBe(false);
    expect(allItems.some((item) => item.href === "/about/release-notes")).toBe(
      false
    );
  });

  it("matches the shared About contents structure in the sidebar menu", () => {
    const { result } = renderHook(() => useSidebarSections(false, false, "US"));

    const aboutSection = result.current.find(
      (section) => section.key === "about"
    );

    expect(aboutSection?.items).toEqual([
      {
        name: "6529 Explained",
        href: "/explained",
        activePathPrefixes: ["/explained/"],
      },
      { name: "Overview", href: "/about", activePathPrefixes: ["/about/"] },
    ]);
    expect(
      aboutSection?.subsections.map((subsection) => subsection.name)
    ).toEqual([
      "Overview",
      "Collections & Minting",
      "Network & Reputation",
      "Safe Collecting",
      "Data & Developer Tools",
      "Legal",
    ]);
    expect(
      aboutSection?.subsections[0]?.items.map((item) => item.name)
    ).toEqual([
      "6529 Apps",
      "FAQ",
      "ENS",
      "Nakamoto Threshold",
      "Apply",
      "Contact Us",
    ]);
    expect(aboutSection?.subsections[1]?.items).toEqual([
      { name: "About The Memes", href: "/about/the-memes" },
      { name: "Subscription Minting", href: "/about/subscriptions" },
      { name: "Meme Lab", href: "/about/meme-lab" },
      { name: "6529 Gradient", href: "/about/6529-gradient" },
      { name: "Minting", href: "/about/minting" },
      { name: "GDRC", href: "/about/gdrc1" },
    ]);
    expect(aboutSection?.subsections[2]?.items).toEqual([
      { name: "Identities", href: "/network" },
      { name: "Activity", href: "/network/activity" },
      { name: "TDH", href: "/network/tdh" },
      { name: "How TDH is calculated", href: "/network/tdh/how-it-works" },
      { name: "TDH specification", href: "/network/tdh/specification" },
      { name: "TDH formal model", href: "/network/tdh/formal" },
      {
        name: "TDH implementations",
        href: "/network/tdh/implementations",
      },
      {
        name: "TDH verification",
        href: "/network/tdh/verification",
        activePathPrefixes: ["/network/tdh/verification/"],
      },
      { name: "xTDH Overview", href: "/network/xtdh" },
      { name: "xTDH Allocations Dashboard", href: "/xtdh" },
      { name: "Wave Score", href: "/network/wave-score" },
      {
        name: "REP Categories",
        href: "/rep/categories",
        activePathPrefixes: ["/rep/categories/"],
      },
      { name: "Network Health", href: "/network/health" },
      { name: "Network Definitions", href: "/network/definitions" },
      { name: "Levels", href: "/network/levels" },
      { name: "Network TDH Stats", href: "/network/health/network-tdh" },
      {
        name: "Network Nerd",
        href: "/network/nerd",
        activePathPrefixes: ["/network/nerd/"],
      },
      {
        name: "TDH historic boosts",
        href: "/network/tdh/historic-boosts",
      },
      {
        name: "Wallet consolidation",
        href: "/network/tdh/consolidation",
      },
    ]);
    expect(aboutSection?.subsections[3]?.items).toEqual([
      { name: "Safe Collecting", href: "/safe-collecting" },
      {
        name: "TAP Guide",
        href: "/safe-collecting/tap-guide",
      },
      { name: "FAQ", href: "/safe-collecting/faq" },
      {
        name: "Consolidation Use Cases",
        href: "/safe-collecting/consolidation-use-cases",
      },
      { name: "Wallet Checker", href: "/safe-collecting/wallet-checker" },
      { name: "Primary Address", href: "/about/primary-address" },
    ]);
    expect(aboutSection?.subsections[4]?.items).toEqual([
      { name: "Tech", href: "/about/tech" },
      {
        name: "Data Decentralization",
        href: "/about/data-decentralization",
      },
      { name: "Subscriptions Report", href: "/tools/subscriptions-report" },
      { name: "Memes Accounting", href: "/meme-accounting" },
      { name: "Memes Gas", href: "/meme-gas" },
      { name: "API", href: "/tools/api" },
      { name: "EMMA", href: "/emma" },
      { name: "Block Finder", href: "/tools/block-finder" },
      { name: "World Time Zones", href: "/tools/time-zones" },
      { name: "Open Data", href: "/open-data" },
      { name: "6529bot Data", href: "/open-data/6529bot" },
      { name: "Network Metrics", href: "/open-data/network-metrics" },
      {
        name: "Meme Subscriptions Data",
        href: "/open-data/meme-subscriptions",
      },
      { name: "ReMemes Data", href: "/open-data/rememes" },
      { name: "Team Data", href: "/open-data/team" },
      { name: "Royalties", href: "/open-data/royalties" },
    ]);
    expect(
      aboutSection?.subsections.some(
        (subsection) => subsection.name === "Tools"
      )
    ).toBe(false);
    expect(
      result.current.some((section) =>
        ["network", "collections", "tools"].includes(section.key)
      )
    ).toBe(false);
  });

  it("includes App Wallets inside About delegation and wallets when supported", () => {
    const { result } = renderHook(() => useSidebarSections(true, false, "US"));

    const aboutSection = result.current.find(
      (section) => section.key === "about"
    );
    const delegationWallets = aboutSection?.subsections.find(
      (subsection) => subsection.name === "Safe Collecting"
    );

    expect(delegationWallets?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "App Wallets",
          href: "/tools/app-wallets",
        }),
      ])
    );
  });

  it("hides subscription-gated links for restricted iOS users", () => {
    const { result } = renderHook(() => useSidebarSections(false, true, "DE"));

    const allItems = result.current.flatMap((section) => [
      ...section.items,
      ...(section.subsections ?? []).flatMap((subsection) => subsection.items),
    ]);

    expect(allItems).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ name: "Subscription Minting" }),
        expect.objectContaining({ name: "Subscriptions Report" }),
        expect.objectContaining({ name: "Meme Subscriptions Data" }),
      ])
    );
  });
});
