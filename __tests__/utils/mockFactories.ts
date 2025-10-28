import { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesList";
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
    },
    picture: null,
    contributors: [],
    isPinned: false,
    ...overrides,
  };
}
