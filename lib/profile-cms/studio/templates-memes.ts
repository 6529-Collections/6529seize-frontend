import { MEME_ARTIST_TEMPLATES } from "./templates-memes-artists";
import { MEME_ORGANIZATION_TEMPLATES } from "./templates-memes-organizations";
import { MEME_PERSONAL_TEMPLATES } from "./templates-memes-personal";
import type { CmsStudioTemplate } from "./template-types";

export const CMS_STUDIO_MEME_TEMPLATES: readonly CmsStudioTemplate[] = [
  ...MEME_PERSONAL_TEMPLATES,
  ...MEME_ARTIST_TEMPLATES,
  ...MEME_ORGANIZATION_TEMPLATES,
].sort(
  (first, second) =>
    (first.inspiration?.cardId ?? 0) - (second.inspiration?.cardId ?? 0)
);
