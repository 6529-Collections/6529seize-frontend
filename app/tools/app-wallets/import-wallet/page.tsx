import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";
import AppWalletImportClient from "./page.client";

export default function AppWalletImportPage() {
  return <AppWalletImportClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Import App Wallet | Tools",
    description: t(DEFAULT_LOCALE, "pageMetadata.appWalletsImport.description"),
  });
}
