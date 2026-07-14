import {
  hasCollectedSupportedNft,
  hasPublicWavePost,
} from "@/app/join/journeyFacts";
import type { ApiCollectedStats } from "@/generated/models/ApiCollectedStats";

const EMPTY_COLLECTED_STATS: ApiCollectedStats = {
  boost: 0,
  gradients_balance: 0,
  memes_balance: 0,
  nextgen_balance: 0,
  seasons: [],
  unique_memes: 0,
};

describe("Join 6529 journey facts", () => {
  it.each(["memes_balance", "nextgen_balance", "gradients_balance"] as const)(
    "treats a positive %s as collected",
    (balanceKey) => {
      expect(
        hasCollectedSupportedNft({
          ...EMPTY_COLLECTED_STATS,
          [balanceKey]: 1,
        })
      ).toBe(true);
    }
  );

  it("does not treat zero supported balances as collected", () => {
    expect(hasCollectedSupportedNft(EMPTY_COLLECTED_STATS)).toBe(false);
    expect(hasCollectedSupportedNft(undefined)).toBe(false);
  });

  it("treats any positive daily public drop count as participation", () => {
    expect(hasPublicWavePost({ date_samples: [0, 0, 1, 0] })).toBe(true);
  });

  it("does not treat empty or zero activity as participation", () => {
    expect(hasPublicWavePost({ date_samples: [0, 0, 0] })).toBe(false);
    expect(hasPublicWavePost({ date_samples: [] })).toBe(false);
    expect(hasPublicWavePost(undefined)).toBe(false);
  });
});
