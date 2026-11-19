import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const metadata: Metadata = getAppMetadata(
  { title: t(DEFAULT_LOCALE, "desktopConnectPreview.title") },
  { robots: { index: false, follow: false } }
);

export default async function DesktopConnectPreviewPage() {
  if (publicEnv.NODE_ENV !== "development") {
    notFound();
  }

  const { default: DesktopConnectPreview } =
    await import("./DesktopConnectPreview");
  return <DesktopConnectPreview />;
}
