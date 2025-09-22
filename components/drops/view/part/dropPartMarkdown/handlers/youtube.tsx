import YoutubePreview from "../youtubePreview";
import { parseYoutubeLink, type YoutubeLinkInfo } from "../youtube";
import { renderExternalOrInternalLink } from "../linkUtils";
import type { LinkHandler } from "../linkTypes";

export const createYoutubeHandler = (): LinkHandler<YoutubeLinkInfo> => ({
  match: parseYoutubeLink,
  render: (payload, context, anchorProps) => (
    <YoutubePreview
      href={payload.url}
      videoId={payload.videoId}
      renderFallback={() => renderExternalOrInternalLink(context.href, anchorProps)}
    />
  ),
  display: "block",
});

export type YoutubeHandler = ReturnType<typeof createYoutubeHandler>;
