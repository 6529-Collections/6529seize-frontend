import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import type { ApiWave } from "@/generated/models/ApiWave";
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
    isInAllWaves: true,
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

/**
 * Creates a mock ApiWave for component tests.
 *
 * ApiWave requires deep API sub-objects (a full ApiDrop, voting/visibility/
 * participation/chat configs) that component tests reading only identity
 * fields never touch, so the literal is asserted to ApiWave rather than
 * constructed whole — the same shape other wave fixtures in this suite use.
 *
 * @param overrides - Partial properties to override defaults
 * @returns ApiWave suitable for component tests
 */
export function createMockApiWave(overrides: Partial<ApiWave> = {}): ApiWave {
  return {
    id: "mock-api-wave-id",
    name: "Mock Wave",
    serial_no: 1,
    picture: null,
    created_at: 0,
    last_drop_time: 0,
    pinned: false,
    identity_wave: false,
    contributors_overview: [],
    subscribed_actions: [],
    pauses: [],
    ...overrides,
  } as ApiWave;
}
