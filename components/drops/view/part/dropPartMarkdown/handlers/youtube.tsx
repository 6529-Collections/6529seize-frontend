import YoutubePreview from "../youtubePreview";
import { parseYoutubeLink, type YoutubeLinkInfo } from "../youtube";
import type { LinkHandler } from "../linkTypes";

export const createYoutubeHandler = (): LinkHandler<YoutubeLinkInfo> => ({
  match: parseYoutubeLink,
  render: (payload, context) => (
    <YoutubePreview
      href={payload.url}
      videoId={payload.videoId}
      renderFallback={() => context.renderFallbackAnchor()}
    />
  ),
  display: "block",
  blockOpenGraphFallback: true,
});

export type YoutubeHandler = ReturnType<typeof createYoutubeHandler>;
