import { LeaderboardFocus } from "@/components/leaderboard/Leaderboard";
import CommunityNerdPageClient from "./page.client";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { focus?: string[] };
}): Promise<Metadata> {
  const focusParam = params.focus?.[0];
  const focus =
    focusParam === "interactions"
      ? LeaderboardFocus.INTERACTIONS
      : LeaderboardFocus.TDH;

  return {
    title: `Network Nerd - ${focus}`,
    description: "Network",
  };
}

export default function CommunityNerdPage({
  params,
}: {
  params: { focus?: string[] };
}) {
  const focusParam = params.focus?.[0];
  const focus =
    focusParam === "interactions"
      ? LeaderboardFocus.INTERACTIONS
      : LeaderboardFocus.TDH;

  return <CommunityNerdPageClient focus={focus} />;
}
