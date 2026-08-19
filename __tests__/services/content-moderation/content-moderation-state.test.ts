import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import {
  getDropHiddenOverride,
  getGlobalDropModerationOverride,
  getProfileBlockedOverride,
  resetContentModerationStateForTests,
  setDropHiddenOverride,
  setGlobalDropModerationOverride,
  setProfileBlockedOverride,
} from "@/services/content-moderation/content-moderation-state";

describe("content moderation presentation overrides", () => {
  beforeEach(resetContentModerationStateForTests);

  it("keeps personal hide and block state scoped to the authenticated viewer", () => {
    setDropHiddenOverride("viewer-1", "drop-1", true);
    setProfileBlockedOverride("viewer-1", "author-1", true);

    expect(getDropHiddenOverride("viewer-1", "drop-1")).toBe(true);
    expect(getProfileBlockedOverride("viewer-1", "author-1")).toBe(true);
    expect(getDropHiddenOverride("viewer-2", "drop-1")).toBeUndefined();
    expect(getProfileBlockedOverride("viewer-2", "author-1")).toBeUndefined();
  });

  it("shares global moderation state across viewers", () => {
    setGlobalDropModerationOverride(
      "drop-1",
      ApiDropModerationStatus.ModeratorRemoved
    );

    expect(getGlobalDropModerationOverride("drop-1")).toBe(
      ApiDropModerationStatus.ModeratorRemoved
    );
  });

  it("removes a restrictive override when content is restored", () => {
    setGlobalDropModerationOverride(
      "drop-1",
      ApiDropModerationStatus.ModeratorRemoved
    );
    setGlobalDropModerationOverride("drop-1", ApiDropModerationStatus.Visible);

    expect(getGlobalDropModerationOverride("drop-1")).toBeUndefined();
  });

  it("can restore the absence of an optimistic personal override", () => {
    setDropHiddenOverride("viewer-1", "drop-1", true);
    setProfileBlockedOverride("viewer-1", "author-1", true);

    setDropHiddenOverride("viewer-1", "drop-1", undefined);
    setProfileBlockedOverride("viewer-1", "author-1", undefined);

    expect(getDropHiddenOverride("viewer-1", "drop-1")).toBeUndefined();
    expect(getProfileBlockedOverride("viewer-1", "author-1")).toBeUndefined();
  });
});
