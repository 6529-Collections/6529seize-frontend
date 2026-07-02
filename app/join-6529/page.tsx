import type { Metadata } from "next";
import { headers } from "next/headers";

import { getAppMetadata } from "@/components/providers/metadata";
import { normalizeLocale, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import Join6529PageClient from "./page.client";

const resolveRequestLocale = async (): Promise<SupportedLocale> => {
  const headersList = await headers();
  const [preferredLocale] = (headersList.get("accept-language") ?? "")
    .split(",")
    .map((value) => value.split(";")[0]?.trim())
    .filter(Boolean);
  return normalizeLocale(preferredLocale);
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveRequestLocale();
  return getAppMetadata({
    title: t(locale, "join6529.metadata.title"),
    description: t(locale, "join6529.metadata.description"),
  });
}

export default function Join6529Page() {
  return <Join6529PageClient />;
}
