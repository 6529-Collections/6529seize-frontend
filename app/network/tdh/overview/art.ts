/**
 * The CC0 art the overview and the hub show: 6529.io's own images of The
 * Memes as its /api/nfts lists them (`thumbnail`, the scaled image, and
 * `image`, the original), by card. The titles are the cards' names on
 * 6529.io; every number on the page comes from the facts.
 */
const MEMES_IMAGES = "https://d3lqz0a4bldqgf.cloudfront.net/images";
const MEMES_CONTRACT = "0x33FD426905F149f8376e227d0C9D3340AaD17aF1";

interface MemeArt {
  readonly id: number;
  readonly title: string;
  /** The scaled image (450 px), for cards on the page. */
  readonly src: string;
  /** The original file, for "Download". */
  readonly original: string;
}

function art(id: number, title: string, originalExt: string): MemeArt {
  return {
    id,
    title,
    src: `${MEMES_IMAGES}/scaled_x450/${MEMES_CONTRACT}/${id}.WEBP`,
    original: `${MEMES_IMAGES}/original/${MEMES_CONTRACT}/${id}.${originalExt}`,
  };
}

/**
 * The scaled art of any card by its number, for a card this file does not
 * list (the newest, still minting); when 6529.io has not made it yet, the
 * card draws its frame.
 */
export function scaledArt(id: number): string {
  return `${MEMES_IMAGES}/scaled_x450/${MEMES_CONTRACT}/${id}.WEBP`;
}

export const MEME_ART = {
  2: art(2, "SeizeJPGs", "JPEG"),
  3: art(3, "UncleSeize", "JPEG"),
  4: art(4, "NakamotoFreedom", "JPEG"),
  562: art(562, "Play the Long Game", "JPG"),
} as const satisfies Readonly<Record<number, MemeArt>>;
