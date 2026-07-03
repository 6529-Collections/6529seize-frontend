import { renderHook } from "@testing-library/react";
import { useSidebarSections } from "@/hooks/useSidebarSections";

describe("useSidebarSections", () => {
  it("returns the menu IA groups with NFT and Waves secondary links", () => {
    const { result } = renderHook(() => useSidebarSections(false, false, "US"));

    expect(result.current.map((section) => section.key)).toEqual([
      "nfts",
      "waves",
      "about",
    ]);

    const nftsSection = result.current.find(
      (section) => section.key === "nfts"
    );
    expect(nftsSection?.name).toBe("NFTs");
    expect(nftsSection?.items.map((item) => item.name)).toEqual([
      "The Memes",
      "6529 Gradient",
      "NextGen",
      "Meme Lab",
      "ReMemes",
      "NFT Activity",
      "Memes Calendar",
    ]);

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
      { name: "About", href: "/about", activePathPrefixes: ["/about/"] },
    ]);
    expect(
      aboutSection?.subsections.map((subsection) => subsection.name)
    ).toEqual([
      "Collections",
      "Network & People",
      "Network Data",
      "Delegation",
      "NFT & Reporting Tools",
      "Developer & Open Data",
      "Resources",
      "Community",
      "Legal",
    ]);
    expect(
      aboutSection?.subsections[0]?.items.map((item) => item.name)
    ).toEqual(["The Memes", "Subscriptions", "Meme Lab", "Gradient"]);
    expect(aboutSection?.subsections[1]?.items).toEqual([
      { name: "Identities", href: "/network" },
      { name: "Activity", href: "/network/activity" },
      { name: "Groups", href: "/network/groups" },
    ]);
    expect(aboutSection?.subsections[2]?.items).toEqual([
      {
        name: "TDH",
        href: "/network/tdh",
        activePathPrefixes: ["/network/tdh/"],
      },
      { name: "xTDH", href: "/xtdh" },
      { name: "Wave Score", href: "/network/wave-score" },
      {
        name: "REP Categories",
        href: "/rep/categories",
        activePathPrefixes: ["/rep/categories/"],
      },
      { name: "Health", href: "/network/health" },
      { name: "Definitions", href: "/network/definitions" },
      { name: "Levels", href: "/network/levels" },
      { name: "Network Stats", href: "/network/health/network-tdh" },
    ]);
    expect(aboutSection?.subsections[3]?.items).toEqual([
      { name: "GDRC", href: "/about/gdrc1" },
      { name: "NFT Delegation", href: "/about/nft-delegation" },
      { name: "Primary Address", href: "/about/primary-address" },
      { name: "Delegation Center", href: "/delegation/delegation-center" },
      {
        name: "Wallet Architecture",
        href: "/delegation/wallet-architecture",
      },
      { name: "Delegation FAQ", href: "/delegation/delegation-faq" },
      {
        name: "Consolidation Use Cases",
        href: "/delegation/consolidation-use-cases",
      },
      { name: "Wallet Checker", href: "/delegation/wallet-checker" },
    ]);
    expect(aboutSection?.subsections[4]?.items).toEqual([
      { name: "Subscriptions Report", href: "/tools/subscriptions-report" },
      { name: "Memes Accounting", href: "/meme-accounting" },
      { name: "Memes Gas", href: "/meme-gas" },
    ]);
    expect(aboutSection?.subsections[5]?.items).toEqual([
      { name: "API", href: "/tools/api" },
      { name: "EMMA", href: "/emma" },
      { name: "Block Finder", href: "/tools/block-finder" },
      { name: "Open Data", href: "/open-data" },
      { name: "6529bot Data", href: "/open-data/6529bot" },
      { name: "Network Metrics", href: "/open-data/network-metrics" },
      { name: "Meme Subscriptions", href: "/open-data/meme-subscriptions" },
      { name: "Rememes", href: "/open-data/rememes" },
      { name: "Team", href: "/open-data/team" },
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

  it("includes App Wallets inside About tools when supported", () => {
    const { result } = renderHook(() => useSidebarSections(true, false, "US"));

    const aboutSection = result.current.find(
      (section) => section.key === "about"
    );
    const nftTools = aboutSection?.subsections.find(
      (subsection) => subsection.name === "NFT & Reporting Tools"
    );

    expect(nftTools?.items).toEqual(
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
        expect.objectContaining({ name: "Subscriptions" }),
        expect.objectContaining({ name: "Subscriptions Report" }),
        expect.objectContaining({ name: "Meme Subscriptions" }),
      ])
    );
  });
});
