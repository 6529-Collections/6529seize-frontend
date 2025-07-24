import { getAppMetadata } from "@/components/providers/metadata";
import { Metadata } from "next";
import AppWalletImportClient from "./page.client";

export default function AppWalletImportPage() {
  return <AppWalletImportClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "App Wallets | Import",
    description: "Tools",
  });
}
