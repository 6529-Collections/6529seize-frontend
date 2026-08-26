import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import {
  clearContentModerationState,
  getDropHiddenOverride,
  getGlobalDropModerationOverride,
  getDropReportStatusOverride,
  getProfileBlockedOverride,
  resetContentModerationStateForTests,
  setDropHiddenOverride,
  setGlobalDropModerationOverride,
  setDropReportStatusOverride,
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

  it("keeps report lifecycle overrides viewer-scoped", () => {
    setDropReportStatusOverride(
      "viewer-1",
      "drop-1",
      ApiContentModerationReportStatus.Open
    );

    expect(getDropReportStatusOverride("viewer-1", "drop-1")).toBe(
      ApiContentModerationReportStatus.Open
    );
    expect(getDropReportStatusOverride("viewer-2", "drop-1")).toBeUndefined();

    setDropReportStatusOverride("viewer-1", "drop-1", null);
    expect(getDropReportStatusOverride("viewer-1", "drop-1")).toBeNull();
  });

  it("removes a restrictive override when content is restored", () => {
    setGlobalDropModerationOverride(
      "drop-1",
      ApiDropModerationStatus.ModeratorRemoved
    );
    setDropReportStatusOverride(
      "viewer-1",
      "drop-2",
      ApiContentModerationReportStatus.Open
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

  it("clears personal and global overrides when the authenticated profile changes", () => {
    setDropHiddenOverride("viewer-1", "drop-1", true);
    setProfileBlockedOverride("viewer-1", "author-1", true);
    setGlobalDropModerationOverride(
      "drop-2",
      ApiDropModerationStatus.ModeratorRemoved
    );

    clearContentModerationState();

    expect(getDropHiddenOverride("viewer-1", "drop-1")).toBeUndefined();
    expect(getProfileBlockedOverride("viewer-1", "author-1")).toBeUndefined();
    expect(getGlobalDropModerationOverride("drop-2")).toBeUndefined();
    expect(getDropReportStatusOverride("viewer-1", "drop-2")).toBeUndefined();
  });
});
