import { renderHook } from "@testing-library/react";
import { useSidebarSections } from "@/hooks/useSidebarSections";

describe("useSidebarSections", () => {
  it("places xTDH and Wave Score under Network and removes xTDH from Collections", () => {
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
    const xtdhIndex =
      networkSection?.items.findIndex((item) => item.name === "xTDH") ?? -1;
    const waveScoreIndex =
      networkSection?.items.findIndex((item) => item.name === "Wave Score") ??
      -1;
    expect(waveScoreIndex).toBe(xtdhIndex + 1);
    expect(
      networkSection?.items.some(
        (item) => item.name === "xTDH" && item.href === "/network/xtdh"
      )
    ).toBe(false);
    expect(collectionsSection?.items.some((item) => item.name === "xTDH")).toBe(
      false
    );
  });
});
