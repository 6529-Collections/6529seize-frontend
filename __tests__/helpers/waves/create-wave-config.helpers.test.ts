import { MEMES_CONTRACT } from "@/constants/constants";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  CREATE_WAVE_CARD_SET_TDH_TOKEN_PARAM,
  CREATE_WAVE_VOTING_TYPE_PARAM,
  getCreateCardTdhWaveHref,
  getCreateWaveInitialConfigFromSearchParams,
} from "@/helpers/waves/create-wave-config.helpers";

jest.mock("@/helpers/time", () => ({
  Time: {
    currentMillis: jest.fn(() => 123456789),
  },
}));

describe("create-wave config helpers", () => {
  it("builds card TDH create hrefs for Meme card pages", () => {
    expect(getCreateCardTdhWaveHref(42)).toBe(
      "/waves/create?votingType=CARD_SET_TDH&cardSetTdhTokenId=42"
    );
  });

  it("creates a Card Set TDH rank-wave prefill from query params", () => {
    const config = getCreateWaveInitialConfigFromSearchParams({
      [CREATE_WAVE_VOTING_TYPE_PARAM]: ApiWaveCreditType.CardSetTdh,
      [CREATE_WAVE_CARD_SET_TDH_TOKEN_PARAM]: "42",
    });

    expect(config?.overview.type).toBe(ApiWaveType.Rank);
    expect(config?.dates.submissionStartDate).toBe(123456789);
    expect(config?.voting.type).toBe(ApiWaveCreditType.CardSetTdh);
    expect(config?.voting.creditNfts).toEqual([
      { contract: MEMES_CONTRACT, token_id: 42 },
    ]);
  });

  it("ignores incomplete or invalid card TDH prefill params", () => {
    expect(getCreateWaveInitialConfigFromSearchParams({})).toBeUndefined();
    expect(
      getCreateWaveInitialConfigFromSearchParams({
        [CREATE_WAVE_VOTING_TYPE_PARAM]: ApiWaveCreditType.Tdh,
        [CREATE_WAVE_CARD_SET_TDH_TOKEN_PARAM]: "42",
      })
    ).toBeUndefined();
    expect(
      getCreateWaveInitialConfigFromSearchParams({
        [CREATE_WAVE_VOTING_TYPE_PARAM]: ApiWaveCreditType.CardSetTdh,
        [CREATE_WAVE_CARD_SET_TDH_TOKEN_PARAM]: "0",
      })
    ).toBeUndefined();
  });
});
