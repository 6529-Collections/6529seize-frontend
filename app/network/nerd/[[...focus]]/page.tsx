
import { LeaderboardFocus } from "@/enums";
import CommunityNerdPageClient from "./page.client";
import { Metadata } from "next";



export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ focus?: string }>;
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
  readonly params: Promise<{ focus?: string }>;
}) {
  const { focus } = await params;
  const focusParam =
    focus?.[0] === "interactions"
      ? LeaderboardFocus.INTERACTIONS
      : LeaderboardFocus.TDH;


  return <CommunityNerdPageClient focus={focusParam} />;
}
