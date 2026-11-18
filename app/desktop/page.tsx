import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";

import DesktopDownloadPage from "@/components/desktop-page/DesktopDownloadPage";
import { getDesktopPageMetadata } from "@/lib/desktop-releases/pageMetadata";
import { getDesktopReleases } from "@/lib/desktop-releases/releases";
import { detectFromUserAgent } from "@/lib/validator-page/detectSystem";

export default async function DesktopRoute() {
  await connection();
  const [releases, requestHeaders] = await Promise.all([
    getDesktopReleases(),
    headers(),
  ]);
  return (
    <DesktopDownloadPage
      releases={releases}
      platform={detectFromUserAgent(requestHeaders.get("user-agent"))}
    />
  );
}

export const metadata: Metadata = getDesktopPageMetadata(
  "desktopPage.meta.download.title",
  "desktopPage.meta.download.description"
);
