import {
  addRecentQuickVoteAmount,
  getDefaultQuickVoteAmount,
  getDisplayQuickVoteAmounts,
  getQuickVoteAbsoluteRemainingPower,
  getQuickVoteRatingRange,
  isMemesQuickVoteVoteableDrop,
  normalizeQuickVoteAmount,
  sanitizeStoredAmounts,
} from "@/hooks/memesQuickVote.helpers";

const createDrop = ({
  maxRating = 5_000,
  minRating = 0,
  rating = 0,
}: {
  readonly maxRating?: number;
  readonly minRating?: number;
  readonly rating?: number;
} = {}) =>
  ({
    context_profile_context: {
      rating,
      min_rating: minRating,
      max_rating: maxRating,
    },
  }) as any;

describe("memesQuickVote.helpers", () => {
  it("sanitizes stored signed quick-vote amounts and keeps the last five unique values", () => {
    expect(
      sanitizeStoredAmounts([
        500,
        -250,
        -250,
        0,
        1.5,
        "50",
        1_000,
        -750,
        2_000,
        -3_000,
        4_000,
      ])
    ).toEqual([1_000, -750, 2_000, -3_000, 4_000]);
  });

  it("keeps the last five unique signed quick-vote amounts and renders them ascending", () => {
    const recent = [-250, 50, 125, 500];
    const withDuplicate = addRecentQuickVoteAmount(recent, -250);
    const withNewAmount = addRecentQuickVoteAmount(withDuplicate, -1_000);
    const capped = addRecentQuickVoteAmount(withNewAmount, 2_000);

    expect(capped).toEqual([125, 500, -250, -1_000, 2_000]);
    expect(getDisplayQuickVoteAmounts(capped)).toEqual([
      -1_000, -250, 125, 500, 2_000,
    ]);
  });

  it("keeps positive-only normalization behavior", () => {
    expect(getDefaultQuickVoteAmount(5_000)).toBe(50);
    expect(getDefaultQuickVoteAmount(99)).toBe(1);
    expect(normalizeQuickVoteAmount("777", 500)).toBe(500);
    expect(normalizeQuickVoteAmount("0", 500)).toBe(1);
    expect(normalizeQuickVoteAmount("-250", 500)).toBe(1);
    expect(normalizeQuickVoteAmount("nope", 500)).toBeNull();
    expect(normalizeQuickVoteAmount("1", 0)).toBeNull();
  });

  it("normalizes signed quick-vote amounts against the full rating range", () => {
    const range = { minRating: -5_000, maxRating: 1_000 };

    expect(normalizeQuickVoteAmount("-250", range)).toBe(-250);
    expect(normalizeQuickVoteAmount("-6000", range)).toBe(-5_000);
    expect(normalizeQuickVoteAmount("6000", range)).toBe(1_000);
    expect(normalizeQuickVoteAmount("0", range)).toBeNull();
    expect(normalizeQuickVoteAmount("", range)).toBeNull();
    expect(normalizeQuickVoteAmount("-", range)).toBeNull();
  });

  it("uses max and min rating to decide quick-vote availability", () => {
    expect(isMemesQuickVoteVoteableDrop(createDrop({ maxRating: 1 }))).toBe(
      true
    );
    expect(
      isMemesQuickVoteVoteableDrop(
        createDrop({ minRating: -500, maxRating: 0 })
      )
    ).toBe(true);
    expect(
      isMemesQuickVoteVoteableDrop(createDrop({ maxRating: 1, rating: 10 }))
    ).toBe(false);
    expect(isMemesQuickVoteVoteableDrop(createDrop({ maxRating: 0 }))).toBe(
      false
    );
  });

  it("derives signed rating ranges and absolute remaining voting power", () => {
    const positiveDominantRange = getQuickVoteRatingRange(
      createDrop({ minRating: -300, maxRating: 500 })
    );
    const negativeDominantRange = getQuickVoteRatingRange(
      createDrop({ minRating: -700, maxRating: 500 })
    );

    expect(positiveDominantRange).toEqual({ minRating: -300, maxRating: 500 });
    expect(getQuickVoteAbsoluteRemainingPower(positiveDominantRange)).toBe(500);
    expect(getQuickVoteAbsoluteRemainingPower(negativeDominantRange)).toBe(700);
  });
});
