import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import {
  addRecentQuickVoteAmount,
  appendSkippedDropId,
  deriveMemesQuickVoteStatsFromDrop,
  getDefaultQuickVoteAmount,
  getDisplayQuickVoteAmounts,
  normalizeQuickVoteAmount,
  sanitizeStoredAmounts,
  sanitizeStoredDropIds,
} from "@/hooks/memesQuickVote.helpers";

const createDrop = ({
  id = "drop-1",
  maxRating = 5_000,
}: {
  readonly id?: string;
  readonly maxRating?: number;
} = {}) =>
  ({
    id,
    serial_no: 1,
    drop_type: "PARTICIPATORY",
    context_profile_context: {
      rating: 0,
      max_rating: maxRating,
    },
    wave: {
      id: "wave-1",
      name: "The Memes",
      voting_credit_type: ApiWaveCreditType.Tdh,
      authenticated_user_eligible_to_vote: true,
      voting_period_start: null,
      voting_period_end: null,
    },
    author: {
      handle: "artist",
      primary_address: "0x123",
    },
    parts: [
      {
        content: "hello",
        media: [],
      },
    ],
    metadata: [],
    created_at: new Date(1_000).toISOString(),
  }) as any;

describe("memesQuickVote.helpers", () => {
  it("sanitizes stored drop ids by trimming, deduping, and removing invalid values", () => {
    expect(
      sanitizeStoredDropIds([
        " drop-1 ",
        "drop-2",
        "drop-1",
        "",
        "   ",
        10,
        null,
      ])
    ).toEqual(["drop-1", "drop-2"]);
  });

  it("sanitizes stored quick-vote amounts and keeps the last five unique values", () => {
    expect(
      sanitizeStoredAmounts([
        500, 500, 250, 0, -1, 1000, 2000, 3000, 4000, 5000,
      ])
    ).toEqual([250, 1000, 2000, 3000, 4000, 5000].slice(-5));
  });

  it("derives footer stats from the first returned unvoted drop", () => {
    expect(
      deriveMemesQuickVoteStatsFromDrop({
        count: 7,
        drop: createDrop({ maxRating: 750 }),
      })
    ).toEqual({
      uncastPower: 750,
      unratedCount: 7,
      votingLabel: "TDH",
    });
  });

  it("returns empty stats when there is no usable first drop", () => {
    expect(
      deriveMemesQuickVoteStatsFromDrop({
        count: 0,
        drop: createDrop(),
      })
    ).toEqual({
      uncastPower: null,
      unratedCount: 0,
      votingLabel: null,
    });
  });

  it("keeps the last five unique quick-vote amounts and renders them ascending", () => {
    const recent = [50, 125, 250, 500];
    const withDuplicate = addRecentQuickVoteAmount(recent, 125);
    const withNewAmount = addRecentQuickVoteAmount(withDuplicate, 1_000);
    const capped = addRecentQuickVoteAmount(withNewAmount, 2_000);

    expect(capped).toEqual([250, 500, 125, 1_000, 2_000]);
    expect(getDisplayQuickVoteAmounts(capped)).toEqual([
      125, 250, 500, 1000, 2000,
    ]);
  });

  it("moves re-skipped drop ids to the tail", () => {
    expect(
      appendSkippedDropId(["drop-30", "drop-10", "drop-20"], "drop-10")
    ).toEqual(["drop-30", "drop-20", "drop-10"]);
  });

  it("derives and clamps quick-vote amounts safely", () => {
    expect(getDefaultQuickVoteAmount(5_000)).toBe(50);
    expect(getDefaultQuickVoteAmount(99)).toBe(1);
    expect(normalizeQuickVoteAmount("777", 500)).toBe(500);
    expect(normalizeQuickVoteAmount("0", 500)).toBe(1);
    expect(normalizeQuickVoteAmount("nope", 500)).toBeNull();
  });
});
