import { renderHook } from "@testing-library/react";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { useContentModerationStateScope } from "@/hooks/content-moderation/useContentModerationStateScope";
import {
  getDropHiddenOverride,
  getGlobalDropModerationOverride,
  resetContentModerationStateForTests,
  setDropHiddenOverride,
  setGlobalDropModerationOverride,
} from "@/services/content-moderation/content-moderation-state";
import { clearClientDropIds } from "@/services/api/idempotent-drop-create";

jest.mock("@/services/api/idempotent-drop-create", () => ({
  clearClientDropIds: jest.fn(),
}));

describe("useContentModerationStateScope", () => {
  beforeEach(resetContentModerationStateForTests);

  it("clears moderation overrides when the connected profile changes", () => {
    const { rerender } = renderHook(
      ({ profileId }) => useContentModerationStateScope(profileId),
      { initialProps: { profileId: "viewer-1" } }
    );
    setDropHiddenOverride("viewer-1", "drop-1", true);
    setGlobalDropModerationOverride(
      "drop-2",
      ApiDropModerationStatus.ModeratorRemoved
    );

    rerender({ profileId: "viewer-2" });

    expect(getDropHiddenOverride("viewer-1", "drop-1")).toBeUndefined();
    expect(getGlobalDropModerationOverride("drop-2")).toBeUndefined();
  });

  it("forgets kept client_drop_ids when the connected profile changes", () => {
    const { rerender } = renderHook(
      ({ profileId }) => useContentModerationStateScope(profileId),
      { initialProps: { profileId: "viewer-1" } }
    );
    jest.mocked(clearClientDropIds).mockClear();

    rerender({ profileId: "viewer-1" });
    expect(clearClientDropIds).not.toHaveBeenCalled();

    rerender({ profileId: "viewer-2" });
    expect(clearClientDropIds).toHaveBeenCalledTimes(1);
  });

  it("keeps moderation overrides when the connected profile is unchanged", () => {
    const { rerender } = renderHook(
      ({ profileId }) => useContentModerationStateScope(profileId),
      { initialProps: { profileId: "viewer-1" } }
    );
    setDropHiddenOverride("viewer-1", "drop-1", true);
    setGlobalDropModerationOverride(
      "drop-2",
      ApiDropModerationStatus.ModeratorRemoved
    );

    rerender({ profileId: "viewer-1" });

    expect(getDropHiddenOverride("viewer-1", "drop-1")).toBe(true);
    expect(getGlobalDropModerationOverride("drop-2")).toBe(
      ApiDropModerationStatus.ModeratorRemoved
    );
  });
});
