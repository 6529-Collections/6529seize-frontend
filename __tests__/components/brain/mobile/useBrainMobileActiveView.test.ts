import { act, renderHook } from "@testing-library/react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { BrainView } from "@/components/brain/mobile/brainMobileViews";
import { useBrainMobileActiveView } from "@/components/brain/mobile/useBrainMobileActiveView";

type UseBrainMobileActiveViewProps = Parameters<
  typeof useBrainMobileActiveView
>[0];

const createSearchParams = (query = ""): ReadonlyURLSearchParams =>
  new URLSearchParams(query) as unknown as ReadonlyURLSearchParams;

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

  it("does not switch completed approve waves to submissions", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          isApproveWave: true,
          isRankWave: false,
          wave: { id: "wave-1" } as UseBrainMobileActiveViewProps["wave"],
        })
      )
    );

    expect(result.current.activeView).toBe(BrainView.DEFAULT);
  });

  it("uses the profile feed view for app /waves?view=profile-feed without a wave", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          isApp: true,
          searchParams: createSearchParams("view=profile-feed"),
          wave: null,
          waveId: null,
        })
      )
    );

    expect(result.current.activeView).toBe(BrainView.PROFILE_FEED);
  });

  it("ignores the profile feed query when a wave is selected", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          isApp: true,
          isCompleted: false,
          isRankWave: false,
          searchParams: createSearchParams("view=profile-feed"),
          wave: { id: "wave-1" } as UseBrainMobileActiveViewProps["wave"],
          waveId: "wave-1",
        })
      )
    );

    expect(result.current.activeView).toBe(BrainView.DEFAULT);
  });

  it("resets Outcome to default for approve curation waves", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          isApproveWave: true,
          isCurationWave: true,
          isRankWave: false,
          wave: { id: "wave-1" } as UseBrainMobileActiveViewProps["wave"],
        })
      )
    );

    act(() => {
      result.current.onViewChange(BrainView.OUTCOME);
    });

    expect(result.current.activeView).toBe(BrainView.DEFAULT);
  });

  it("resets Outcome to default when outcome view is hidden", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          isApproveWave: true,
          isRankWave: false,
          showOutcomeView: false,
          wave: { id: "wave-1" } as UseBrainMobileActiveViewProps["wave"],
        })
      )
    );

    act(() => {
      result.current.onViewChange(BrainView.OUTCOME);
    });

    expect(result.current.activeView).toBe(BrainView.DEFAULT);
  });

  it("resets Outcome to submissions for completed rank curation waves", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          isCurationWave: true,
          wave: { id: "wave-1" } as UseBrainMobileActiveViewProps["wave"],
        })
      )
    );

    act(() => {
      result.current.onViewChange(BrainView.OUTCOME);
    });

    expect(result.current.activeView).toBe(BrainView.SUBMISSIONS);
  });

  it("keeps My Votes for authenticated normal rank waves", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          hasAuthenticatedProfile: true,
          wave: { id: "wave-1" } as UseBrainMobileActiveViewProps["wave"],
        })
      )
    );

    act(() => {
      result.current.onViewChange(BrainView.MY_VOTES);
    });

    expect(result.current.activeView).toBe(BrainView.MY_VOTES);
  });

  it("keeps Polls for loaded waves", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          isCompleted: false,
          hasPolls: true,
          isRankWave: false,
          wave: { id: "wave-1" } as UseBrainMobileActiveViewProps["wave"],
        })
      )
    );

    act(() => {
      result.current.onViewChange(BrainView.POLLS);
    });

    expect(result.current.activeView).toBe(BrainView.POLLS);
  });

  it("resets My Votes for guests on normal rank waves", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          hasAuthenticatedProfile: false,
          wave: { id: "wave-1" } as UseBrainMobileActiveViewProps["wave"],
        })
      )
    );

    act(() => {
      result.current.onViewChange(BrainView.MY_VOTES);
    });

    expect(result.current.activeView).toBe(BrainView.SUBMISSIONS);
  });

  it("keeps My Votes for curation rank waves without requiring login", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          hasAuthenticatedProfile: false,
          isCurationWave: true,
          wave: { id: "wave-1" } as UseBrainMobileActiveViewProps["wave"],
        })
      )
    );

    act(() => {
      result.current.onViewChange(BrainView.MY_VOTES);
    });

    expect(result.current.activeView).toBe(BrainView.MY_VOTES);
  });

  it("keeps My Votes for authenticated normal approve waves", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          hasAuthenticatedProfile: true,
          isApproveWave: true,
          isRankWave: false,
          wave: { id: "wave-1" } as UseBrainMobileActiveViewProps["wave"],
        })
      )
    );

    act(() => {
      result.current.onViewChange(BrainView.MY_VOTES);
    });

    expect(result.current.activeView).toBe(BrainView.MY_VOTES);
  });

  it("resets My Votes for guests on normal approve waves", () => {
    const { result } = renderHook(() =>
      useBrainMobileActiveView(
        createProps({
          isApproveWave: true,
          isRankWave: false,
          wave: { id: "wave-1" } as UseBrainMobileActiveViewProps["wave"],
        })
      )
    );

    act(() => {
      result.current.onViewChange(BrainView.MY_VOTES);
    });

    expect(result.current.activeView).toBe(BrainView.DEFAULT);
  });
});
