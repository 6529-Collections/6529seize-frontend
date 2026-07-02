import { renderHook } from "@testing-library/react";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import { useLoadActiveSidebarParentSubwaves } from "@/hooks/useLoadActiveSidebarParentSubwaves";
import { useMyStream } from "@/contexts/wave/MyStreamContext";

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(),
}));

const mockUseMyStream = useMyStream as jest.Mock;

describe("useLoadActiveSidebarParentSubwaves", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads a missing active parent once while waiting for child rows", () => {
    const loadSubwavesForParent = jest.fn();
    mockUseMyStream.mockReturnValue({
      waves: { loadSubwavesForParent },
    });
    const waves = [
      createMockMinimalWave({
        id: "parent",
        hasSubwaves: true,
      }),
    ];
    const { rerender } = renderHook(
      ({
        activeParentWaveId,
      }: {
        readonly activeParentWaveId: string | null;
      }) =>
        useLoadActiveSidebarParentSubwaves({
          activeParentWaveId,
          waves,
        }),
      {
        initialProps: {
          activeParentWaveId: "parent",
        },
      }
    );

    expect(loadSubwavesForParent).toHaveBeenCalledTimes(1);
    expect(loadSubwavesForParent).toHaveBeenCalledWith("parent");

    rerender({
      activeParentWaveId: "parent",
    });

    expect(loadSubwavesForParent).toHaveBeenCalledTimes(1);
  });

  it("allows a missing active parent to be requested again after leaving it", () => {
    const loadSubwavesForParent = jest.fn();
    mockUseMyStream.mockReturnValue({
      waves: { loadSubwavesForParent },
    });
    const waves = [
      createMockMinimalWave({
        id: "parent",
        hasSubwaves: true,
      }),
    ];
    const { rerender } = renderHook(
      ({
        activeParentWaveId,
      }: {
        readonly activeParentWaveId: string | null;
      }) =>
        useLoadActiveSidebarParentSubwaves({
          activeParentWaveId,
          waves,
        }),
      {
        initialProps: {
          activeParentWaveId: "parent",
        },
      }
    );

    expect(loadSubwavesForParent).toHaveBeenCalledTimes(1);

    rerender({
      activeParentWaveId: null,
    });
    rerender({
      activeParentWaveId: "parent",
    });

    expect(loadSubwavesForParent).toHaveBeenCalledTimes(2);
    expect(loadSubwavesForParent).toHaveBeenLastCalledWith("parent");
  });

  it("does not load when the active parent's child rows are already present", () => {
    const loadSubwavesForParent = jest.fn();
    mockUseMyStream.mockReturnValue({
      waves: { loadSubwavesForParent },
    });
    const waves = [
      createMockMinimalWave({
        id: "parent",
        hasSubwaves: true,
      }),
      createMockMinimalWave({
        id: "child",
        parentWaveId: "parent",
      }),
    ];

    renderHook(() =>
      useLoadActiveSidebarParentSubwaves({
        activeParentWaveId: "parent",
        waves,
      })
    );

    expect(loadSubwavesForParent).not.toHaveBeenCalled();
  });
});
