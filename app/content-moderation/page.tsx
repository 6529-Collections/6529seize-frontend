import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import ContentModerationPageClient from "./page.client";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "contentModeration.moderator.metaTitle"),
  description: t(DEFAULT_LOCALE, "contentModeration.moderator.metaDescription"),
});

export default function ContentModerationPage() {
  return <ContentModerationPageClient />;
}
