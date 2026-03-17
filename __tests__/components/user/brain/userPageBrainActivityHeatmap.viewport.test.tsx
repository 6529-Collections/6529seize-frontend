import { act, renderHook } from "@testing-library/react";
import { useHeatmapViewport } from "@/components/user/brain/userPageBrainActivityHeatmap.viewport";

describe("useHeatmapViewport", () => {
  it("snaps to the true max scroll position so the latest column stays visible", () => {
    const { result, rerender } = renderHook(
      ({ resetKey }: { resetKey: string }) => useHeatmapViewport(resetKey),
      {
        initialProps: {
          resetKey: "profile-a",
        },
      }
    );

    const viewport = document.createElement("div");
    const content = document.createElement("div");
    viewport.appendChild(content);

    Object.defineProperty(viewport, "clientWidth", {
      configurable: true,
      value: 101,
    });
    Object.defineProperty(viewport, "scrollWidth", {
      configurable: true,
      value: 140,
    });

    act(() => {
      result.current.viewportRef(viewport);
      rerender({ resetKey: "profile-b" });
    });

    expect(viewport.scrollLeft).toBe(39);
  });
});
