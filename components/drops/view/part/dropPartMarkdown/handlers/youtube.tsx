import YoutubePreview from "../youtubePreview";
import { parseYoutubeLink } from "../youtube";
import { createSimpleHandler } from "./simpleHandler";

export const createYoutubeHandler = () =>
  createSimpleHandler({
    match: (href) => Boolean(parseYoutubeLink(href)),
    render: (href) => <YoutubePreview href={href} />,
  });

export type YoutubeHandler = ReturnType<typeof createYoutubeHandler>;
