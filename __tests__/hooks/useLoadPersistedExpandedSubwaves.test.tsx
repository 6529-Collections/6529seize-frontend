import { renderHook } from "@testing-library/react";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import { useLoadPersistedExpandedSubwaves } from "@/hooks/useLoadPersistedExpandedSubwaves";
import { useMyStream } from "@/contexts/wave/MyStreamContext";

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(),
}));

const mockUseMyStream = useMyStream as jest.Mock;

const EXPANSION_STORAGE_KEY = "sidebar-wave-tree-expansion-v1";

const seedExpansionState = (state: {
  readonly expandedParentIds: readonly string[];
  readonly collapsedParentIds: readonly string[];
}) => {
  globalThis.sessionStorage.setItem(
    EXPANSION_STORAGE_KEY,
    JSON.stringify(state)
  );
};

describe("useLoadPersistedExpandedSubwaves", () => {
  let loadSubwavesForParent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.sessionStorage.clear();
    loadSubwavesForParent = jest.fn();
    mockUseMyStream.mockReturnValue({
      waves: { loadSubwavesForParent },
    });
  });

  it("re-fetches subwaves once for a remembered expanded parent", () => {
    seedExpansionState({
      expandedParentIds: ["parent"],
      collapsedParentIds: [],
    });
    const waves = [createMockMinimalWave({ id: "parent", hasSubwaves: true })];

    const { rerender } = renderHook(() =>
      useLoadPersistedExpandedSubwaves({ waves })
    );

    expect(loadSubwavesForParent).toHaveBeenCalledTimes(1);
    expect(loadSubwavesForParent).toHaveBeenCalledWith("parent");

    rerender();
    expect(loadSubwavesForParent).toHaveBeenCalledTimes(1);
  });

  it("waits for the parent to appear in the list before requesting", () => {
    seedExpansionState({
      expandedParentIds: ["parent"],
      collapsedParentIds: [],
    });

    const { rerender } = renderHook(
      ({ waves }: { readonly waves: any[] }) =>
        useLoadPersistedExpandedSubwaves({ waves }),
      { initialProps: { waves: [] as any[] } }
    );

    expect(loadSubwavesForParent).not.toHaveBeenCalled();

    rerender({
      waves: [createMockMinimalWave({ id: "parent", hasSubwaves: true })],
    });

    expect(loadSubwavesForParent).toHaveBeenCalledTimes(1);
    expect(loadSubwavesForParent).toHaveBeenCalledWith("parent");
  });

  it("skips parents whose subwaves are already loaded", () => {
    seedExpansionState({
      expandedParentIds: ["parent"],
      collapsedParentIds: [],
    });
    const waves = [
      createMockMinimalWave({ id: "parent", hasSubwaves: true }),
      createMockMinimalWave({ id: "child", parentWaveId: "parent" }),
    ];

    renderHook(() => useLoadPersistedExpandedSubwaves({ waves }));

    expect(loadSubwavesForParent).not.toHaveBeenCalled();
  });

  it("ignores parents the user later collapsed", () => {
    seedExpansionState({
      expandedParentIds: ["parent"],
      collapsedParentIds: ["parent"],
    });
    const waves = [createMockMinimalWave({ id: "parent", hasSubwaves: true })];

    renderHook(() => useLoadPersistedExpandedSubwaves({ waves }));

    expect(loadSubwavesForParent).not.toHaveBeenCalled();
  });

  it("does nothing without a persisted expansion state", () => {
    const waves = [createMockMinimalWave({ id: "parent", hasSubwaves: true })];

    renderHook(() => useLoadPersistedExpandedSubwaves({ waves }));

    expect(loadSubwavesForParent).not.toHaveBeenCalled();
  });

  it("never treats a subwave id as a parent", () => {
    seedExpansionState({
      expandedParentIds: ["child"],
      collapsedParentIds: [],
    });
    const waves = [
      createMockMinimalWave({ id: "parent", hasSubwaves: true }),
      createMockMinimalWave({ id: "child", parentWaveId: "parent" }),
    ];

    renderHook(() => useLoadPersistedExpandedSubwaves({ waves }));

    expect(loadSubwavesForParent).not.toHaveBeenCalled();
  });
});
