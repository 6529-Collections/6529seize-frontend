export const MEMES_NOMINEE_CATEGORY = "MemesNominee";
export const MEMES_NOMINEE_REQUIRED_REP = 50_000;
export const MEMES_SEEKING_NOMINATION_WAVE_ID =
  "0ecb95d0-d8f2-48e8-8137-bfa71ee8593c";

const getCategoryPresentationKey = (category: string): string =>
  category
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");

const MEMES_NOMINEE_PRESENTATION_KEY = getCategoryPresentationKey(
  MEMES_NOMINEE_CATEGORY
);
const MEMES_NOMINEE_SEARCH_PREFIX_MIN_LENGTH =
  getCategoryPresentationKey("MemesN").length;

export const isMemesNomineePresentationVariant = (category: string): boolean =>
  getCategoryPresentationKey(category) === MEMES_NOMINEE_PRESENTATION_KEY;

export const isMemesNomineeSearchPrefix = (search: string): boolean => {
  const searchKey = getCategoryPresentationKey(search);
  return (
    searchKey.length >= MEMES_NOMINEE_SEARCH_PREFIX_MIN_LENGTH &&
    MEMES_NOMINEE_PRESENTATION_KEY.startsWith(searchKey)
  );
};
