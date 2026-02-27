interface ArtistActivityProfileLike {
  readonly active_main_stage_submission_ids?: readonly string[] | null;
  readonly winner_main_stage_drop_ids?: readonly string[] | null;
  readonly artist_of_prevote_cards?: readonly number[] | null;
}

export const getSubmissionCount = (
  profile: ArtistActivityProfileLike
): number => profile.active_main_stage_submission_ids?.length ?? 0;

const getWinnerCount = (profile: ArtistActivityProfileLike): number =>
  profile.winner_main_stage_drop_ids?.length ?? 0;

const getPrevoteArtistCount = (profile: ArtistActivityProfileLike): number =>
  profile.artist_of_prevote_cards?.length ?? 0;

export const getTrophyArtworkCount = (
  profile: ArtistActivityProfileLike
): number => getWinnerCount(profile) + getPrevoteArtistCount(profile);
