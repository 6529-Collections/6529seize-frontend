import TikTokCard from "@/components/waves/TikTokCard";
import { parseTikTokLink, type TikTokLinkInfo } from "../tiktok";
import { renderExternalOrInternalLink } from "../linkUtils";
import type { LinkHandler } from "../linkTypes";

export const createTikTokHandler = (): LinkHandler<TikTokLinkInfo> => ({
  match: parseTikTokLink,
  render: (_payload, context, anchorProps) => (
    <TikTokCard
      href={context.href}
      renderFallback={() => renderExternalOrInternalLink(context.href, anchorProps)}
    />
  ),
  display: "block",
});

export type TikTokHandler = ReturnType<typeof createTikTokHandler>;
