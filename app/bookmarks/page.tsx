import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import BookmarksPage from "@/components/bookmarks/BookmarksPage";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
export function generateMetadata(): Metadata {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "bookmarks.title"),
      description: t(DEFAULT_LOCALE, "bookmarks.private"),
    },
    { robots: { index: false, follow: false } }
  );
}
export default function Page() {
  return <BookmarksPage />;
}
