import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import AppWalletsClient from "./page.client";

export default function AppWalletsPage() {
  return <AppWalletsClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "App Wallets | Tools",
    description: t(DEFAULT_LOCALE, "pageMetadata.appWallets.description"),
  });
}
