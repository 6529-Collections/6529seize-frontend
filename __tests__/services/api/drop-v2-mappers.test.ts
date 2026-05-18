import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import { mapApiWaveOverviewToApiWaveMin } from "@/services/api/drop-v2-mappers";

type ApiWaveOverviewWithVoteRestrictions = ApiWaveOverview & {
  readonly forbid_negative_votes?: boolean;
};

const createWaveOverview = (
  overrides: Partial<ApiWaveOverviewWithVoteRestrictions> = {}
): ApiWaveOverviewWithVoteRestrictions => ({
  id: "wave-1",
  name: "Wave 1",
  pfp: "wave.png",
  last_drop_time: 100,
  created_at: 50,
  subscribers_count: 1,
  has_competition: false,
  is_dm_wave: false,
  description_drop: {},
  total_drops_count: 1,
  is_private: false,
  context_profile_context: {
    subscribed: false,
    pinned: false,
    can_chat: true,
    unread_drops: 0,
    muted: false,
  },
  ...overrides,
});

describe("mapApiWaveOverviewToApiWaveMin", () => {
  it("preserves no-negative vote waves from V2 overviews", () => {
    const result = mapApiWaveOverviewToApiWaveMin(
      createWaveOverview({ forbid_negative_votes: true })
    );

    expect(result.forbid_negative_votes).toBe(true);
  });

  it("allows negative votes when the V2 overview does not forbid them", () => {
    expect(
      mapApiWaveOverviewToApiWaveMin(
        createWaveOverview({ forbid_negative_votes: false })
      ).forbid_negative_votes
    ).toBe(false);
    expect(
      mapApiWaveOverviewToApiWaveMin(createWaveOverview()).forbid_negative_votes
    ).toBe(false);
  });
});
