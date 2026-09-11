import {
  getProfileCurationSourceWaveRequest,
  resolveProfileCuration,
  resolveWavePickerViewState,
} from "@/components/user/waves/userPageProfileWave.helpers";

describe("profile Curation helpers", () => {
  it("builds a public Chat Wave with owner-only administration", () => {
    const request = getProfileCurationSourceWaveRequest({
      adminGroupId: "group-1",
      handle: "alice",
      now: 123_456,
    });

    expect(request.name).toBe("alice Curation");
    expect(request.wave.admin_group?.group_id).toBe("group-1");
    expect(request.visibility.scope.group_id).toBeNull();
    expect(request.participation.scope.group_id).toBeNull();
    expect(request.chat.scope.group_id).toBeNull();
    expect(request.description_drop.parts[0]?.content).toContain("@alice");
  });

  it("offers setup when none of the user's Waves are eligible", () => {
    expect(
      resolveWavePickerViewState({
        createdWaves: [],
        hasCreatedProfile: true,
        hasActiveProfileProxy: false,
        isOwnProfile: true,
        status: "success",
      })
    ).toEqual({ kind: "no_public_waves", hasCreatedWaves: false });
  });

  it("falls back to the first available Curation after a stale selection", () => {
    const available = { id: "curation-1" } as any;

    expect(resolveProfileCuration([available], "deleted-curation")).toBe(
      available
    );
  });
});
