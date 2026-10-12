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

  it("maps open reply eligibility separately from chat eligibility", () => {
    const result = mapApiWaveOverviewToApiWaveMin(
      createWaveOverview({
        context_profile_context: {
          subscribed: false,
          pinned: false,
          can_chat: false,
          can_reply: true,
          unread_drops: 0,
          muted: false,
        },
      })
    );

    expect(result.authenticated_user_eligible_to_chat).toBe(false);
    expect(result.authenticated_user_eligible_to_reply).toBe(true);
    expect(result.authenticated_user_can_delete_replies).toBe(false);
  });

  it("maps reply moderation from the viewer context", () => {
    const result = mapApiWaveOverviewToApiWaveMin(
      createWaveOverview({
        context_profile_context: {
          subscribed: false,
          pinned: false,
          can_chat: true,
          can_reply: true,
          can_delete_replies: true,
          unread_drops: 0,
          muted: false,
        },
      })
    );

    expect(result.authenticated_user_can_delete_replies).toBe(true);
  });

  it("falls back to chat eligibility when the API has no reply flag", () => {
    expect(
      mapApiWaveOverviewToApiWaveMin(createWaveOverview())
        .authenticated_user_eligible_to_reply
    ).toBe(true);
  });
});
