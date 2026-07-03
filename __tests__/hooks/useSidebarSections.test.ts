import { renderHook } from "@testing-library/react";
import { useSidebarSections } from "@/hooks/useSidebarSections";

describe("useSidebarSections", () => {
  it("returns the menu IA groups with NFT, Waves, Tools, and About links", () => {
    const { result } = renderHook(() => useSidebarSections(false, false, "US"));

    expect(result.current.map((section) => section.key)).toEqual([
      "nfts",
      "waves",
      "tools",
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
    const findAboutSubsection = (name: string) =>
      aboutSection?.subsections.find((subsection) => subsection.name === name);

    expect(aboutSection?.items).toEqual([
      { name: "About", href: "/about", activePathPrefixes: ["/about/"] },
    ]);
    expect(
      aboutSection?.subsections.map((subsection) => subsection.name)
    ).toEqual([
      "Collections",
      "Network & People",
      "Network Data",
      "Digital Rights",
      "Delegation",
      "NFT & Reporting Tools",
      "Developer & Open Data",
      "Resources",
      "Community",
      "Legal",
    ]);
    expect(findAboutSubsection("Collections")?.items).toEqual([
      { name: "The Memes", href: "/about/the-memes" },
      { name: "Subscriptions", href: "/about/subscriptions" },
      { name: "Meme Lab", href: "/about/meme-lab" },
      { name: "Gradient", href: "/about/6529-gradient" },
    ]);
    expect(findAboutSubsection("Network & People")?.items).toEqual([
      { name: "Identities", href: "/network" },
      { name: "Activity", href: "/network/activity" },
      { name: "Groups", href: "/network/groups" },
    ]);
    expect(findAboutSubsection("Network Data")?.items).toEqual([
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
    expect(findAboutSubsection("Digital Rights")?.items).toEqual([
      { name: "GDRC", href: "/about/gdrc1" },
    ]);
    expect(findAboutSubsection("Delegation")?.items).toEqual([
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
    expect(findAboutSubsection("Developer & Open Data")?.items).toEqual(
      expect.arrayContaining([
        { name: "Open Data", href: "/open-data" },
        { name: "6529bot Data", href: "/open-data/6529bot" },
        { name: "Network Metrics", href: "/open-data/network-metrics" },
      ])
    );
  });

  it("includes the Tools index and shared Tools categories", () => {
    const { result } = renderHook(() => useSidebarSections(false, false, "US"));

    const toolsSection = result.current.find(
      (section) => section.key === "tools"
    );

    expect(toolsSection?.items).toEqual([{ name: "Tools", href: "/tools" }]);
    expect(
      toolsSection?.subsections.map((subsection) => subsection.name)
    ).toEqual([
      "NFT Delegation",
      "The Memes Tools",
      "Builder Tools",
      "Open Data",
    ]);
    expect(toolsSection?.subsections[0]?.items).toEqual([
      { name: "Delegation Center", href: "/delegation/delegation-center" },
      { name: "Wallet Architecture", href: "/delegation/wallet-architecture" },
      { name: "Delegation FAQ", href: "/delegation/delegation-faq" },
      {
        name: "Consolidation Use Cases",
        href: "/delegation/consolidation-use-cases",
      },
      { name: "Wallet Checker", href: "/delegation/wallet-checker" },
    ]);
    expect(toolsSection?.subsections[2]?.items).toEqual([
      { name: "API", href: "/tools/api" },
      { name: "EMMA", href: "/emma" },
      { name: "Block Finder", href: "/tools/block-finder" },
    ]);
    expect(
      toolsSection?.subsections[3]?.items.some(
        (item) =>
          item.name === "6529bot Usage" && item.href === "/open-data/6529bot"
      )
    ).toBe(true);
  });

  it("includes App Wallets in Tools and About tool groups when supported", () => {
    const { result } = renderHook(() => useSidebarSections(true, false, "US"));

    const toolsSection = result.current.find(
      (section) => section.key === "tools"
    );
    const aboutSection = result.current.find(
      (section) => section.key === "about"
    );
    const toolsBuilder = toolsSection?.subsections.find(
      (subsection) => subsection.name === "Builder Tools"
    );
    const aboutNftTools = aboutSection?.subsections.find(
      (subsection) => subsection.name === "NFT & Reporting Tools"
    );

    expect(toolsBuilder?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "App Wallets",
          href: "/tools/app-wallets",
        }),
      ])
    );
    expect(aboutNftTools?.items).toEqual(
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
