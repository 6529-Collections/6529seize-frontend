import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesList";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

/**
 * Creates a mock MinimalWave object with sensible defaults for testing
 * @param overrides - Partial properties to override defaults
 * @returns Complete MinimalWave object suitable for testing
 */
export function createMockMinimalWave(overrides: Partial<MinimalWave> = {}): MinimalWave {
  return {
    id: "mock-wave-id",
    name: "Mock Wave",
    type: ApiWaveType.Chat,
    newDropsCount: {
      count: 0,
      latestDropTimestamp: null,
      firstUnreadSerialNo: null,
    },
    picture: null,
    contributors: [],
    isPinned: false,
    unreadDropsCount: 0,
    latestReadTimestamp: 0,
    firstUnreadDropSerialNo: null,
    isMuted: false,
    ...overrides,
  };
}
