import { renderHook, act } from "@testing-library/react";
import { useWaveConfig } from "@/components/waves/create-wave/hooks/useWaveConfig";
import { CreateWaveGroupConfigType, CreateWaveStep } from "@/types/waves.types";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";

jest.mock("@/components/waves/create-wave/hooks/useMemeCardCount", () => ({
  useMemeCardCount: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
}));

describe("useWaveConfig", () => {
  it("prevents step change when validation fails", () => {
    const { result } = renderHook(() => useWaveConfig());
    act(() => {
      result.current.onStep({
        step: CreateWaveStep.GROUPS,
        direction: "forward",
      });
    });
    expect(result.current.step).toBe(CreateWaveStep.OVERVIEW);
    expect(result.current.errors.length).toBeGreaterThan(0);
  });

  it("updates drops admin delete flag", () => {
    const { result } = renderHook(() => useWaveConfig());
    act(() => {
      result.current.setDropsAdminCanDelete(true);
    });
    expect(result.current.config.drops.adminCanDeleteDrops).toBe(true);
  });

  it("stores selected group ids and caches selected group objects", () => {
    const { result } = renderHook(() => useWaveConfig());
    const group = {
      id: "group-1",
      name: "Alpha Group",
    } as ApiGroupFull;

    act(() => {
      result.current.onGroupSelect({
        group,
        groupType: CreateWaveGroupConfigType.CAN_VIEW,
      });
    });

    expect(result.current.config.groups.canView).toBe("group-1");
    expect(result.current.groupsCache["group-1"]).toEqual(group);
  });
});
