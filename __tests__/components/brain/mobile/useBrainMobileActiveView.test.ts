import { renderHook } from "@testing-library/react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { BrainView } from "@/components/brain/mobile/brainMobileViews";
import { useBrainMobileActiveView } from "@/components/brain/mobile/useBrainMobileActiveView";

type UseBrainMobileActiveViewProps = Parameters<
  typeof useBrainMobileActiveView
>[0];

const createSearchParams = (): ReadonlyURLSearchParams =>
  new URLSearchParams() as unknown as ReadonlyURLSearchParams;

const createProps = (
  overrides: Partial<UseBrainMobileActiveViewProps> = {}
): UseBrainMobileActiveViewProps => ({
  firstDecisionDone: false,
  isApp: false,
  isCompleted: true,
  hasAuthenticatedProfile: false,
  isCurationWave: false,
  isMemesWave: false,
  isRankWave: true,
  pathname: "/waves",
  searchParams: createSearchParams(),
  wave: null,
  waveId: "wave-1",
  ...overrides,
});

describe("useBrainMobileActiveView", () => {
  it("does not default to submissions while the wave is loading", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(createProps({ wave: undefined }))
    );

    expect(result.current.activeView).toBe(BrainView.DEFAULT);
  });

  it("defaults to submissions after a completed rank wave is loaded", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          wave: { id: "wave-1" } as UseBrainMobileActiveViewProps["wave"],
        })
      )
    );

    expect(result.current.activeView).toBe(BrainView.SUBMISSIONS);
  });
});
