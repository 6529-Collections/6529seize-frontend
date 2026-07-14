import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

/**
 * Creates a mock MinimalWave object with sensible defaults for testing
 * @param overrides - Partial properties to override defaults
 * @returns Complete MinimalWave object suitable for testing
 */
export function createMockMinimalWave(
  overrides: Partial<MinimalWave> = {}
): MinimalWave {
  return {
    id: "mock-wave-id",
    name: "Mock Wave",
    type: ApiWaveType.Chat,
    createdAt: 0,
    newDropsCount: {
      count: 0,
      latestDropTimestamp: null,
      firstUnreadSerialNo: null,
    },
    picture: null,
    contributors: [],
    isPinned: false,
    isFollowing: false,
    isOfficial: false,
    parentWaveId: null,
    hasSubwaves: false,
    unreadDropsCount: 0,
    latestReadTimestamp: 0,
    firstUnreadDropSerialNo: null,
    isMuted: false,
    waveRep: null,
    waveScore: null,
    sidebarSection: null,
    followedSubwavesCount: 0,
    latestFollowedSubwaveDropTimestamp: null,
    unreadSubwaveDrops: 0,
    firstUnreadFollowedSubwaveDropSerialNo: null,
    sidebarActivityTimestamp: null,
    isFollowedSubwaveContainer: false,
    ...overrides,
  };
}
