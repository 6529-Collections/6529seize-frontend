import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import {
  getDropIdentityFallbackValue,
  getDropIdentityProfile,
  getDropVisibleMetadata,
} from "@/components/waves/drops/identityDisplay.helpers";

describe("identityDisplay helpers", () => {
  const resolvedProfile = {
    id: "p1",
    handle: "alice",
    primary_address: "0xabc",
    pfp: null,
    banner1_color: null,
    banner2_color: null,
    cic: 1,
    rep: 2,
    tdh: 3,
    tdh_rate: 4,
    xtdh: 5,
    xtdh_rate: 6,
    level: 7,
    subscribed_actions: [],
    archived: false,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    artist_of_prevote_cards: [],
    is_wave_creator: false,
  };

  it("returns the resolved profile for identity waves", () => {
    expect(
      getDropIdentityProfile({
        wave: {
          submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
        } as any,
        metadata: [
          {
            data_key: "identity",
            data_value: "0xabc",
            resolved_profile: resolvedProfile,
          },
        ] as any,
      })
    ).toEqual(resolvedProfile);
  });

  it("returns a raw identity fallback when the profile is unresolved", () => {
    expect(
      getDropIdentityFallbackValue({
        wave: {
          submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
        } as any,
        metadata: [
          {
            data_key: "identity",
            data_value: "  0xabc  ",
          },
        ] as any,
      })
    ).toBe("0xabc");
  });

  it("returns null for whitespace-only identity fallback values", () => {
    expect(
      getDropIdentityFallbackValue({
        wave: {
          submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
        } as any,
        metadata: [
          {
            data_key: "identity",
            data_value: "   ",
          },
        ] as any,
      })
    ).toBeNull();
  });

  it("filters the reserved identity metadata for identity waves", () => {
    expect(
      getDropVisibleMetadata({
        wave: {
          submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
        } as any,
        metadata: [
          {
            data_key: "identity",
            data_value: "0xabc",
            resolved_profile: resolvedProfile,
          },
          {
            data_key: "title",
            data_value: "drop title",
          },
        ] as any,
      })
    ).toEqual([{ data_key: "title", data_value: "drop title" }]);
  });

  it("keeps metadata unchanged for non-identity waves", () => {
    const metadata = [
      { data_key: "identity", data_value: "0xabc" },
      { data_key: "title", data_value: "drop title" },
    ];

    expect(
      getDropVisibleMetadata({
        wave: { submission_type: null } as any,
        metadata: metadata as any,
      })
    ).toEqual(metadata);
  });
});
