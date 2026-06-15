import { getProfileWaveReorderGate } from "@/components/user/waves/userPageProfileWaveReorder.helpers";

const gate = (
  overrides: Partial<Parameters<typeof getProfileWaveReorderGate>[0]> = {}
) =>
  getProfileWaveReorderGate({
    canClear: true,
    canManageCuration: true,
    dropCount: 2,
    hasProfileCuration: true,
    isDropsFetching: false,
    isPermissionLoading: false,
    ...overrides,
  });

describe("userPageProfileWaveReorder helpers", () => {
  it("allows reorder only after curation management is confirmed for multiple drops", () => {
    expect(gate()).toEqual({
      canReorder: true,
      isLoading: false,
      shouldShowButton: true,
    });

    expect(gate({ canManageCuration: false })).toEqual({
      canReorder: false,
      isLoading: false,
      shouldShowButton: false,
    });

    expect(gate({ dropCount: 1 })).toEqual({
      canReorder: false,
      isLoading: false,
      shouldShowButton: false,
    });
  });

  it("shows a disabled loading gate while drops or permission are unresolved", () => {
    expect(
      gate({
        canManageCuration: false,
        dropCount: 0,
        isDropsFetching: true,
      })
    ).toEqual({
      canReorder: false,
      isLoading: true,
      shouldShowButton: true,
    });

    expect(
      gate({
        canManageCuration: false,
        isPermissionLoading: true,
      })
    ).toEqual({
      canReorder: false,
      isLoading: true,
      shouldShowButton: true,
    });
  });
});
