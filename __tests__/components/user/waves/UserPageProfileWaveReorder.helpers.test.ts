import { getProfileWaveReorderGate } from "@/components/user/waves/userPageProfileWaveReorder.helpers";

type GateInput = Parameters<typeof getProfileWaveReorderGate>[0];

const baseGate: GateInput = {
  canClear: true,
  canManageCuration: true,
  dropCount: 2,
  hasProfileCuration: true,
  isDropsFetching: false,
  isPermissionLoading: false,
};

const closed = { canReorder: false, isLoading: false, shouldShowButton: false };
const loading = { canReorder: false, isLoading: true, shouldShowButton: true };

describe("userPageProfileWaveReorder helpers", () => {
  it.each([
    [{}, { canReorder: true, isLoading: false, shouldShowButton: true }],
    [{ canManageCuration: false }, closed],
    [{ dropCount: 1 }, closed],
    [
      { canManageCuration: false, dropCount: 0, isDropsFetching: true },
      loading,
    ],
    [{ canManageCuration: false, isPermissionLoading: true }, loading],
  ] satisfies Array<
    [Partial<GateInput>, ReturnType<typeof getProfileWaveReorderGate>]
  >)("returns the expected reorder gate for %o", (overrides, expected) => {
    expect(getProfileWaveReorderGate({ ...baseGate, ...overrides })).toEqual(
      expected
    );
  });
});
