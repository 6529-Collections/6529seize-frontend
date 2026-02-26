import { getAppMetadata } from "@/components/providers/metadata";

import AppWalletImportClient from "./page.client";

import type { Metadata } from "next";

export default function AppWalletImportPage() {
  return <AppWalletImportClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "App Wallets | Import",
    description: "Tools",
  });
}
