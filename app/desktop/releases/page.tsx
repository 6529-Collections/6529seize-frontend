import type { Metadata } from "next";
import { connection } from "next/server";

import DesktopReleaseHistory from "@/components/desktop-page/DesktopReleaseHistory";
import { getDesktopPageMetadata } from "@/lib/desktop-releases/pageMetadata";
import { getDesktopReleases } from "@/lib/desktop-releases/releases";

export default async function DesktopReleasesRoute() {
  await connection();
  return <DesktopReleaseHistory releases={await getDesktopReleases()} />;
}

export const metadata: Metadata = getDesktopPageMetadata(
  "desktopPage.meta.releases.title",
  "desktopPage.meta.releases.description"
);
