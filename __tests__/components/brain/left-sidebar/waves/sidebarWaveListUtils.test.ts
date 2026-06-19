import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import { groupSidebarWaves } from "@/components/brain/left-sidebar/waves/sidebarWaveListUtils";

describe("sidebarWaveListUtils", () => {
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
  });
});
