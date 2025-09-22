import TikTokCard from "@/components/waves/TikTokCard";
import { parseTikTokLink } from "../tiktok";
import type { LinkHandler } from "../linkTypes";

export const createTikTokHandler = (): LinkHandler => ({
  match: (href) => Boolean(parseTikTokLink(href)),
  render: (href) => <TikTokCard href={href} />,
  display: "block",
});

export type TikTokHandler = ReturnType<typeof createTikTokHandler>;
