interface ArtistActivityProfileLike {
  readonly active_main_stage_submission_ids?: readonly string[] | null;
  readonly winner_main_stage_drop_ids?: readonly string[] | null;
  readonly artist_of_prevote_cards?: readonly number[] | null;
  readonly badges?: {
    readonly artist_of_main_stage_submissions?: number | null;
    readonly artist_of_memes?: number | null;
  } | null;
}

const getNonNegativeCount = (count: number | null | undefined): number => {
  if (typeof count !== "number" || !Number.isFinite(count)) {
    return 0;
  }
  return Math.max(0, count);
};

const getArrayCount = (
  items: readonly string[] | readonly number[] | null | undefined
): number => items?.length ?? 0;

export const getSubmissionCount = (
  profile: ArtistActivityProfileLike
): number =>
  Math.max(
    getArrayCount(profile.active_main_stage_submission_ids),
    getNonNegativeCount(profile.badges?.artist_of_main_stage_submissions)
  );

const getWinnerCount = (profile: ArtistActivityProfileLike): number =>
  getArrayCount(profile.winner_main_stage_drop_ids);

const getPrevoteArtistCount = (profile: ArtistActivityProfileLike): number =>
  getArrayCount(profile.artist_of_prevote_cards);

export const getTrophyArtworkCount = (
  profile: ArtistActivityProfileLike
): number =>
  Math.max(
    getWinnerCount(profile) + getPrevoteArtistCount(profile),
    getNonNegativeCount(profile.badges?.artist_of_memes)
  );
