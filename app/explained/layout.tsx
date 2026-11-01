import type { Metadata } from "next";
import type { ReactNode } from "react";
import { kt } from "@/components/explained/i18n";
import { DEFAULT_LOCALE } from "@/i18n/locales";

/**
 * A pass-through layout whose only job is the title of an address that
 * names no page: Next renders a not-found view with its layouts' metadata,
 * not the page's, so without this the tab would show the site's default
 * title. Every page sets its own title, which wins.
 */
export const metadata: Metadata = {
  title: kt(DEFAULT_LOCALE, "explained.kit.notFound.metaTitle"),
};

export default function Layout({ children }: { readonly children: ReactNode }) {
  return children;
}
