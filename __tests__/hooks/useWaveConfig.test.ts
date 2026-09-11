import { renderHook, act } from "@testing-library/react";
import { useWaveConfig } from "@/components/waves/create-wave/hooks/useWaveConfig";
import { CreateWaveGroupConfigType, CreateWaveStep } from "@/types/waves.types";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useWaveGroupValidation } from "@/components/waves/create-wave/hooks/useWaveGroupValidation";

jest.mock("@/components/waves/create-wave/hooks/useMemeCardCount", () => ({
  useMemeCardCount: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
}));
jest.mock(
  "@/components/waves/create-wave/hooks/useWaveGroupValidation",
  () => ({
    useWaveGroupValidation: jest.fn(() => ({
      data: { valid: true, invalid_roles: [] },
      isFetching: false,
      isError: false,
      refetch: jest.fn().mockResolvedValue({
        data: { valid: true, invalid_roles: [] },
        isError: false,
      }),
    })),
  })
);

describe("useWaveConfig", () => {
  it.each(["parent-view-group", null, undefined])(
    "initializes access and chat with the supplied view group %s",
    (initialViewGroupId) => {
      const { result } = renderHook(() =>
        useWaveConfig({ initialViewGroupId })
      );

      expect(result.current.config.groups).toEqual({
        canView: initialViewGroupId ?? null,
        canChat: initialViewGroupId ?? null,
        canDrop: null,
        canVote: null,
        admin: null,
      });
      expect(useWaveGroupValidation).toHaveBeenLastCalledWith(
        result.current.config
      );
    }
  );

  it.each([ApiWaveType.Rank, ApiWaveType.Approve])(
    "restores the inherited group for access and participation when switching to %s",
    (type) => {
      const { result } = renderHook(() =>
        useWaveConfig({ initialViewGroupId: "parent-view-group" })
      );
      act(() => {
        result.current.onGroupSelect({
          group: null,
          groupType: CreateWaveGroupConfigType.CAN_VIEW,
        });
      });
      act(() => {
        result.current.setOverview({ ...result.current.config.overview, type });
      });

      expect(result.current.config.groups).toEqual({
        canView: "parent-view-group",
        canChat: "parent-view-group",
        canDrop: "parent-view-group",
        canVote: "parent-view-group",
        admin: null,
      });
      expect(useWaveGroupValidation).toHaveBeenLastCalledWith(
        result.current.config
      );

      act(() => {
        result.current.setOverview({
          ...result.current.config.overview,
          type: ApiWaveType.Chat,
        });
      });
      expect(result.current.config.groups).toEqual({
        canView: "parent-view-group",
        canChat: "parent-view-group",
        canDrop: null,
        canVote: null,
        admin: null,
      });
    }
  );

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
    expect(result.current.config.groups.canChat).toBe("group-1");
    expect(result.current.config.groups.canDrop).toBeNull();
    expect(result.current.config.groups.canVote).toBeNull();
    expect(result.current.groupsCache["group-1"]).toEqual(group);
  });
});
