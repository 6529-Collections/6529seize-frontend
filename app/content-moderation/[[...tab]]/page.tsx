import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getModerationTab } from "../content-moderation-tabs";
import ContentModerationPageClient from "../page.client";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "contentModeration.moderator.metaTitle"),
  description: t(DEFAULT_LOCALE, "contentModeration.moderator.metaDescription"),
});

export default async function ContentModerationPage({
  params,
}: {
  readonly params: Promise<{ tab?: string[] }>;
}) {
  const { tab = [] } = await params;
  if (tab.length > 1 || getModerationTab(tab[0]) === null) {
    notFound();
  }
  return <ContentModerationPageClient />;
}
