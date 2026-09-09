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

  it("waits for a direct-linked parent to enter the sidebar before loading", () => {
    const loadSubwavesForParent = jest.fn();
    mockUseMyStream.mockReturnValue({
      waves: { loadSubwavesForParent },
    });
    const parentWave = createMockMinimalWave({
      id: "parent",
      hasSubwaves: true,
    });
    const { rerender } = renderHook(
      ({ waves }: { readonly waves: readonly (typeof parentWave)[] }) =>
        useLoadActiveSidebarParentSubwaves({
          activeParentWaveId: "parent",
          waves,
        }),
      {
        initialProps: {
          waves: [] as readonly (typeof parentWave)[],
        },
      }
    );

    expect(loadSubwavesForParent).not.toHaveBeenCalled();

    rerender({ waves: [parentWave] });

    expect(loadSubwavesForParent).toHaveBeenCalledTimes(1);
    expect(loadSubwavesForParent).toHaveBeenCalledWith("parent");
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

  it("registers the active parent once when child rows are already present", () => {
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

    expect(loadSubwavesForParent).toHaveBeenCalledTimes(1);
    expect(loadSubwavesForParent).toHaveBeenCalledWith("parent");
  });
});
