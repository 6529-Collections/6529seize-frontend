import TikTokCard from "@/components/waves/TikTokCard";
import { parseTikTokLink } from "../tiktok";
import { createSimpleHandler } from "./simpleHandler";

export const createTikTokHandler = () =>
  createSimpleHandler({
    match: (href) => Boolean(parseTikTokLink(href)),
    render: (href) => <TikTokCard href={href} />,
  });

export type TikTokHandler = ReturnType<typeof createTikTokHandler>;
