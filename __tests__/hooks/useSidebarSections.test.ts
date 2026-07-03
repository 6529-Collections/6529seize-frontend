import { renderHook } from "@testing-library/react";
import { useSidebarSections } from "@/hooks/useSidebarSections";

describe("useSidebarSections", () => {
  it("places xTDH, Wave Score, and REP Categories under Network", () => {
    const { result } = renderHook(() => useSidebarSections(false, false, "US"));

    const networkSection = result.current.find(
      (section) => section.key === "network"
    );
    const collectionsSection = result.current.find(
      (section) => section.key === "collections"
    );

    expect(networkSection).toBeDefined();
    expect(collectionsSection).toBeDefined();
    expect(
      networkSection?.items.some(
        (item) => item.name === "xTDH" && item.href === "/xtdh"
      )
    ).toBe(true);
    expect(
      networkSection?.items.some(
        (item) =>
          item.name === "Wave Score" && item.href === "/network/wave-score"
      )
    ).toBe(true);
    expect(
      networkSection?.items.some(
        (item) =>
          item.name === "REP Categories" && item.href === "/rep/categories"
      )
    ).toBe(true);
    expect(
      networkSection?.subsections[0]?.items.find(
        (item) => item.href === "/network/definitions"
      )?.activatesSection
    ).not.toBe(false);
    const xtdhIndex =
      networkSection?.items.findIndex((item) => item.name === "xTDH") ?? -1;
    const waveScoreIndex =
      networkSection?.items.findIndex((item) => item.name === "Wave Score") ??
      -1;
    const repCategoriesIndex =
      networkSection?.items.findIndex(
        (item) => item.name === "REP Categories"
      ) ?? -1;
    expect(waveScoreIndex).toBe(xtdhIndex + 1);
    expect(repCategoriesIndex).toBe(waveScoreIndex + 1);
    expect(
      networkSection?.items.some(
        (item) => item.name === "xTDH" && item.href === "/network/xtdh"
      )
    ).toBe(false);
    expect(collectionsSection?.items.some((item) => item.name === "xTDH")).toBe(
      false
    );
  });

  it("does not include retired release notes links", () => {
    const { result } = renderHook(() => useSidebarSections(false, false, "US"));

    const allItems = result.current.flatMap((section) => [
      ...section.items,
      ...section.subsections.flatMap((subsection) => subsection.items),
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

    expect(aboutSection?.items).toEqual([{ name: "About", href: "/about" }]);
    expect(
      aboutSection?.subsections.map((subsection) => subsection.name)
    ).toEqual([
      "Collections",
      "Digital Rights",
      "Delegation",
      "Network",
      "Resources",
      "Community",
      "Legal",
    ]);
    expect(
      aboutSection?.subsections[0]?.items.map((item) => item.name)
    ).toEqual(["The Memes", "Subscriptions", "Meme Lab", "Gradient"]);
    expect(aboutSection?.subsections[1]?.items).toEqual([
      { name: "GDRC", href: "/about/gdrc1" },
    ]);
    expect(aboutSection?.subsections[2]?.items).toEqual([
      { name: "NFT Delegation", href: "/about/nft-delegation" },
      { name: "Primary Address", href: "/about/primary-address" },
    ]);
    expect(aboutSection?.subsections[3]?.items).toEqual([
      { name: "TDH", href: "/network/tdh", activatesSection: false },
      { name: "xTDH", href: "/network/xtdh", activatesSection: false },
      { name: "Health", href: "/network/health", activatesSection: false },
      {
        name: "Definitions",
        href: "/network/definitions",
        activatesSection: false,
      },
      { name: "Levels", href: "/network/levels", activatesSection: false },
      {
        name: "Network Stats",
        href: "/network/health/network-tdh",
        activatesSection: false,
      },
    ]);
    expect(
      aboutSection?.subsections.some((subsection) => subsection.name === "NFTs")
    ).toBe(false);
    expect(
      aboutSection?.subsections.some(
        (subsection) => subsection.name === "Support"
      )
    ).toBe(false);
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
});
