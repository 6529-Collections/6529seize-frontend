import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import {
  groupSidebarWaves,
  hasUnreadWaveDrops,
  prioritizeActiveWaveContainer,
} from "@/components/brain/left-sidebar/waves/sidebarWaveListUtils";

describe("sidebarWaveListUtils", () => {
  it.each([
    { label: "known unread", unread: 3, live: 0, muted: false, expected: true },
    { label: "live unread", unread: 0, live: 2, muted: false, expected: true },
    { label: "read", unread: 0, live: 0, muted: false, expected: false },
    {
      label: "muted known unread",
      unread: 3,
      live: 0,
      muted: true,
      expected: false,
    },
    {
      label: "muted live unread",
      unread: 0,
      live: 2,
      muted: true,
      expected: false,
    },
  ])(
    "uses the same unread state for $label rows",
    ({ unread, live, muted, expected }) => {
      const wave = createMockMinimalWave({
        unreadDropsCount: unread,
        isMuted: muted,
        newDropsCount: {
          count: live,
          latestDropTimestamp: null,
          firstUnreadSerialNo: null,
        },
      });

      expect(hasUnreadWaveDrops(wave)).toBe(expected);
    }
  );

  it("groups followed-subwave parent containers with following waves", () => {
    const groups = groupSidebarWaves({
      waves: [
        createMockMinimalWave({
          id: "subwave-parent",
          isFollowing: false,
          isFollowedSubwaveContainer: true,
        }),
        createMockMinimalWave({
          id: "quality-wave",
          isInAllWaves: true,
          sidebarSection: "highly-rated",
        }),
      ],
    });

    expect(groups.followingWaves.map((wave) => wave.id)).toEqual([
      "subwave-parent",
    ]);
    expect(groups.highlyRatedWaves.map((wave) => wave.id)).toEqual([
      "quality-wave",
    ]);
    expect(groups.allWaves.map((wave) => wave.id)).toEqual([
      "subwave-parent",
      "quality-wave",
    ]);
  });

  it("keeps worth checking out membership overlapping with activity-ordered All", () => {
    const groups = groupSidebarWaves({
      isAnnouncementsWave: (waveId) => waveId === "announcement",
      waves: [
        createMockMinimalWave({
          id: "quality-wave",
          isInAllWaves: true,
          sidebarActivityTimestamp: 200,
          sidebarSection: "highly-rated",
        }),
        createMockMinimalWave({
          id: "recent-wave",
          sidebarActivityTimestamp: 300,
        }),
        createMockMinimalWave({
          id: "older-wave",
          sidebarActivityTimestamp: 100,
        }),
        createMockMinimalWave({ id: "announcement" }),
        createMockMinimalWave({ id: "pinned", isPinned: true }),
      ],
    });

    expect(groups.highlyRatedWaves.map((wave) => wave.id)).toEqual([
      "quality-wave",
    ]);
    expect(groups.allWaves.map((wave) => wave.id)).toEqual([
      "recent-wave",
      "quality-wave",
      "older-wave",
    ]);
    expect(groups.announcementWaves.map((wave) => wave.id)).toEqual([
      "announcement",
    ]);
    expect(groups.pinnedWaves.map((wave) => wave.id)).toEqual(["pinned"]);
  });

  it("keeps discovery-only recommendations out of the Joined bottom list", () => {
    const groups = groupSidebarWaves({
      waves: [
        createMockMinimalWave({
          id: "recommendation",
          isInAllWaves: false,
          sidebarSection: "highly-rated",
        }),
        createMockMinimalWave({ id: "joined-wave", isFollowing: true }),
      ],
    });

    expect(groups.highlyRatedWaves.map((wave) => wave.id)).toEqual([
      "recommendation",
    ]);
    expect(groups.allWaves.map((wave) => wave.id)).toEqual(["joined-wave"]);
  });

  it("keeps pinned highly rated waves out of worth checking out", () => {
    const groups = groupSidebarWaves({
      waves: [
        createMockMinimalWave({
          id: "pinned-quality-wave",
          isPinned: true,
          sidebarSection: "highly-rated",
        }),
      ],
    });

    expect(groups.pinnedWaves.map((wave) => wave.id)).toEqual([
      "pinned-quality-wave",
    ]);
    expect(groups.highlyRatedWaves).toEqual([]);
  });

  it("anchors the active route container ahead of activity-sorted roots", () => {
    const newest = createMockMinimalWave({ id: "newest" });
    const activeParent = createMockMinimalWave({ id: "active-parent" });
    const older = createMockMinimalWave({ id: "older" });

    expect(
      prioritizeActiveWaveContainer(
        [newest, activeParent, older],
        activeParent.id
      ).map((wave) => wave.id)
    ).toEqual(["active-parent", "newest", "older"]);
  });
});
