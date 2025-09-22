import TikTokCard from "@/components/waves/TikTokCard";
import { parseTikTokLink, type TikTokLinkInfo } from "../tiktok";
import type { LinkHandler } from "../linkTypes";

export const createTikTokHandler = (): LinkHandler<TikTokLinkInfo> => ({
  match: parseTikTokLink,
  render: (_payload, context) => (
    <TikTokCard
      href={context.href}
      renderFallback={() => context.renderFallbackAnchor()}
    />
  ),
  display: "block",
  blockOpenGraphFallback: true,
});

export type TikTokHandler = ReturnType<typeof createTikTokHandler>;
