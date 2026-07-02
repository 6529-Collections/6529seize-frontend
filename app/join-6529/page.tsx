import type { Metadata } from "next";

import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import Join6529PageClient from "./page.client";

const JOIN_6529_LOCALE = DEFAULT_LOCALE;

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: t(JOIN_6529_LOCALE, "join6529.metadata.title"),
    description: t(JOIN_6529_LOCALE, "join6529.metadata.description"),
  });
}

export default function Join6529Page() {
  return <Join6529PageClient />;
}
