import { renderHook } from "@testing-library/react";
import { useSidebarSections } from "@/hooks/useSidebarSections";

describe("useSidebarSections", () => {
  it("places xTDH under Network and removes it from Collections", () => {
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
        (item) => item.name === "xTDH" && item.href === "/network/xtdh"
      )
    ).toBe(false);
    expect(collectionsSection?.items.some((item) => item.name === "xTDH")).toBe(
      false
    );
  });
});
