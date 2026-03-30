import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import {
  getWinnerIdentityFallbackValue,
  getWinnerIdentityProfile,
  getWinnerVisibleMetadata,
} from "@/components/waves/winners/identity/winnerIdentity.helpers";

describe("winnerIdentity helpers", () => {
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

  const metadata = [
    {
      data_key: "identity",
      data_value: "0xabc",
      resolved_profile: resolvedProfile,
    },
    {
      data_key: "title",
      data_value: "winner title",
    },
  ];

  it("returns the resolved profile for identity winner drops", () => {
    expect(
      getWinnerIdentityProfile({
        wave: {
          submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
        } as any,
        metadata: metadata as any,
      })
    ).toEqual(resolvedProfile);
  });

  it("returns an unresolved identity fallback value", () => {
    expect(
      getWinnerIdentityFallbackValue({
        wave: {
          submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
        } as any,
        metadata: [{ data_key: "identity", data_value: "  0xdef  " }] as any,
      })
    ).toBe("0xdef");
  });

  it("filters the reserved identity metadata for identity winner drops", () => {
    expect(
      getWinnerVisibleMetadata({
        wave: {
          submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
        } as any,
        metadata: metadata as any,
      })
    ).toEqual([{ data_key: "title", data_value: "winner title" }]);
  });
});
