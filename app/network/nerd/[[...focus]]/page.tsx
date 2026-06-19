import { getAppMetadata } from "@/components/providers/metadata";
import { LeaderboardFocus } from "@/types/enums";
import type { Metadata } from "next";
import { Suspense } from "react";
import CommunityNerdPageClient from "./page.client";

type CommunityNerdPageParams = {
  focus?: string[] | undefined;
};

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<CommunityNerdPageParams>;
}): Promise<Metadata> {
  const { focus } = await params;
  const focusParam =
    focus?.[0] === "interactions"
      ? LeaderboardFocus.INTERACTIONS
      : LeaderboardFocus.TDH;

  return getAppMetadata({
    title: `Network Nerd - ${focusParam}`,
    description: "Network",
  });
}

export default async function CommunityNerdPage({
  params,
}: {
  readonly params: Promise<CommunityNerdPageParams>;
}) {
  const { focus } = await params;
  const focusParam =
    focus?.[0] === "interactions"
      ? LeaderboardFocus.INTERACTIONS
      : LeaderboardFocus.TDH;

  return (
    <Suspense fallback={null}>
      <CommunityNerdPageClient focus={focusParam} />
    </Suspense>
  );
}
