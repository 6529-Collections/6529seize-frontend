import { getCmsStudioMemeWork } from "./meme-assets";
import { defineTemplate, externalLink, image } from "./template-recipes";
import type { CmsStudioTemplate } from "./template-types";

export function memeTemplate(
  cardId: number,
  template: Omit<CmsStudioTemplate, "inspiration">
): CmsStudioTemplate {
  const work = getCmsStudioMemeWork(cardId);
  return defineTemplate({
    ...template,
    inspiration: {
      kind: "meme",
      cardId,
      title: work.title,
      artist: work.artist,
      url: work.url,
    },
  });
}

export function memeImage(
  cardId: number,
  span: "full" | "half" | "third" | "two_thirds" = "full"
) {
  const work = getCmsStudioMemeWork(cardId);
  return image(
    work.asset.id,
    `${work.title} by ${work.artist}. The Memes #${cardId}, CC0.`,
    span
  );
}

export function memeCredit(cardId: number) {
  const work = getCmsStudioMemeWork(cardId);
  return externalLink(`View ${work.title} by ${work.artist}`, work.url);
}
