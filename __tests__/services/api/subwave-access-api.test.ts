import { ApiWaveGroupRole } from "@/generated/models/ApiWaveGroupRole";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { hasSubwaveMembersOutsideParent } from "@/services/api/subwave-access-api";
import { validateWaveGroups } from "@/services/api/wave-group-validation-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/services/api/wave-group-validation-api", () => ({
  validateWaveGroups: jest.fn(),
}));

const mockFetch = jest.mocked(commonApiFetch);
const mockValidate = jest.mocked(validateWaveGroups);
const parentWave = (viewGroupId: string | null) =>
  ({
    visibility: { scope: { group: viewGroupId ? { id: viewGroupId } : null } },
  }) as ApiWave;

describe("subwave audience containment", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not check top-level waves", async () => {
    await expect(
      hasSubwaveMembersOutsideParent({
        parentWaveId: null,
        viewGroupId: "group",
      })
    ).resolves.toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([
    { parentGroup: null, childGroup: "group", warning: false },
    { parentGroup: null, childGroup: null, warning: false },
    { parentGroup: "group", childGroup: "group", warning: false },
    { parentGroup: "group", childGroup: null, warning: true },
  ])(
    "checks public and identical audiences: $parentGroup / $childGroup",
    async ({ parentGroup, childGroup, warning }) => {
      mockFetch.mockResolvedValue(parentWave(parentGroup));
      await expect(
        hasSubwaveMembersOutsideParent({
          parentWaveId: "parent",
          viewGroupId: childGroup,
        })
      ).resolves.toBe(warning);
      expect(mockValidate).not.toHaveBeenCalled();
    }
  );

  it.each([true, false])(
    "uses complete group containment, valid=%s",
    async (valid) => {
      const controller = new AbortController();
      mockFetch.mockResolvedValue(parentWave("parent-group"));
      mockValidate.mockResolvedValue({
        valid,
        invalid_roles: valid ? [] : [ApiWaveGroupRole.Chat],
      });

      await expect(
        hasSubwaveMembersOutsideParent(
          { parentWaveId: "parent", viewGroupId: "assembled-group" },
          controller.signal
        )
      ).resolves.toBe(!valid);
      expect(mockFetch).toHaveBeenCalledWith({
        endpoint: "waves/parent",
        signal: controller.signal,
      });
      expect(mockValidate).toHaveBeenCalledWith(
        {
          visibility_group_id: "parent-group",
          chat_group_id: "assembled-group",
        },
        controller.signal
      );
    }
  );

  it("does not mistake a failed comparison for an audience mismatch", async () => {
    mockFetch.mockResolvedValue(parentWave("parent-group"));
    mockValidate.mockRejectedValue(new Error("unavailable"));
    await expect(
      hasSubwaveMembersOutsideParent({
        parentWaveId: "parent",
        viewGroupId: "group",
      })
    ).rejects.toThrow("unavailable");
  });
});
