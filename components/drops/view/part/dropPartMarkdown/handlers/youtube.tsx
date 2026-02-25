import { parseYoutubeLink } from "../youtube";
import YoutubePreview from "../youtubePreview";

import type { LinkHandler } from "../linkTypes";

export const createYoutubeHandler = (): LinkHandler => ({
  match: (href) => Boolean(parseYoutubeLink(href)),
  render: (href) => <YoutubePreview href={href} />,
  display: "block",
});
