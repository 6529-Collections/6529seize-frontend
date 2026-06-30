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
    expect(
      allItems.some((item) => item.href === "/about/release-notes")
    ).toBe(false);
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
      "Delegation",
      "Network",
      "Resources",
      "Community",
      "Legal",
    ]);
    expect(
      aboutSection?.subsections[0]?.items.map((item) => item.name)
    ).toEqual(["The Memes", "Subscriptions", "Meme Lab", "Gradient"]);
    expect(aboutSection?.subsections[2]?.items).toEqual([
      { name: "TDH", href: "/network/tdh" },
      { name: "xTDH", href: "/network/xtdh" },
      { name: "Health", href: "/network/health" },
      { name: "Definitions", href: "/network/definitions" },
      { name: "Levels", href: "/network/levels" },
      { name: "Network Stats", href: "/network/health/network-tdh" },
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
});
