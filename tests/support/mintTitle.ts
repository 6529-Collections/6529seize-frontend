// Client-side TitleContext enrichment races the App Router metadata commit.
// Accept both the plain server title and the enriched title. Artwork names
// can contain pipes, so only the outer title format is fixed.
export const MEMES_MINT_TITLE_PATTERN = /^Mint( #\d+ \| .+)? \| The Memes$/;
