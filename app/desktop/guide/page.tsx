import type { Metadata } from "next";
import { connection } from "next/server";

import DesktopGuide from "@/components/desktop-page/DesktopGuide";
import { getDesktopPageMetadata } from "@/lib/desktop-releases/pageMetadata";
import {
  getDesktopReleases,
  getNewestDesktopRelease,
} from "@/lib/desktop-releases/releases";

export default async function DesktopGuideRoute() {
  await connection();
  const { releases } = await getDesktopReleases();
  return <DesktopGuide release={getNewestDesktopRelease(releases)} />;
}

export const metadata: Metadata = getDesktopPageMetadata(
  "desktopPage.meta.guide.title",
  "desktopPage.meta.guide.description"
);
