import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import BlockPickerClient from "./page.client";

export default function BlockFinderPage() {
  return <BlockPickerClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Block Finder | Tools",
    description: t(DEFAULT_LOCALE, "pageMetadata.blockFinder.description"),
  });
}
