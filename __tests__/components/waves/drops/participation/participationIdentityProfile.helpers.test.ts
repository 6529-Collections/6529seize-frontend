import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import {
  getParticipationIdentityProfile,
  getParticipationVisibleMetadata,
} from "@/components/waves/drops/participation/participationIdentityProfile.helpers";

describe("participationIdentityProfile helpers", () => {
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
      data_value: "drop title",
    },
  ];

  it("returns the resolved profile for identity waves", () => {
    expect(
      getParticipationIdentityProfile({
        wave: {
          submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
        } as any,
        metadata: metadata as any,
      })
    ).toEqual(resolvedProfile);
  });

  it("filters the reserved identity metadata for identity waves", () => {
    expect(
      getParticipationVisibleMetadata({
        wave: {
          submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
        } as any,
        metadata: metadata as any,
      })
    ).toEqual([{ data_key: "title", data_value: "drop title" }]);
  });

  it("keeps identity metadata untouched for non-identity waves", () => {
    expect(
      getParticipationVisibleMetadata({
        wave: { submission_type: null } as any,
        metadata: metadata as any,
      })
    ).toEqual(metadata);
  });
});
