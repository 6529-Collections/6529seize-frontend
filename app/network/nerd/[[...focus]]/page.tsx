import { LeaderboardFocus } from "@/types/enums";
import type { Metadata } from "next";
import CommunityNerdPageClient from "./page.client";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ focus?: string | undefined }>;
}): Promise<Metadata> {
  const { focus } = await params;
  const focusParam =
    focus === "interactions"
      ? LeaderboardFocus.INTERACTIONS
      : LeaderboardFocus.TDH;

  return {
    title: `Network Nerd - ${focusParam}`,
    description: "Network",
  };
}

export default async function CommunityNerdPage({
  params,
}: {
  readonly params: Promise<{ focus?: string | undefined }>;
}) {
  const { focus } = await params;
  const focusParam =
    focus?.[0] === "interactions"
      ? LeaderboardFocus.INTERACTIONS
      : LeaderboardFocus.TDH;

  return <CommunityNerdPageClient focus={focusParam} />;
}
