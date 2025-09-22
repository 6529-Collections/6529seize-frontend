import YoutubePreview from "../youtubePreview";
import { parseYoutubeLink } from "../youtube";
import type { LinkHandler } from "../linkTypes";

export const createYoutubeHandler = (): LinkHandler => ({
  match: (href) => Boolean(parseYoutubeLink(href)),
  render: (href) => <YoutubePreview href={href} />,
  display: "block",
});

export type YoutubeHandler = ReturnType<typeof createYoutubeHandler>;
